import os
import re
import json
import urllib.request
import urllib.error
from pathlib import Path

os.environ["FASTF1_NO_AUTH"] = "1"

import numpy as np
import pandas as pd
import fastf1
from dotenv import load_dotenv

try:
    if hasattr(fastf1, "_api") and hasattr(fastf1._api, "tokens"):
        fastf1._api.tokens.get_f1_token = lambda *args, **kwargs: None
except Exception:
    pass

ROOT_DIR = Path(__file__).resolve().parent
# Load .env files without overwriting already-set Render environment variables
load_dotenv(dotenv_path=ROOT_DIR / ".env", override=False)
load_dotenv(dotenv_path=ROOT_DIR / "frontend" / ".env", override=False)

def get_groq_api_key() -> str:
    raw_key = os.getenv("GROQ_API_KEY", "")
    # Strip spaces, single quotes, and double quotes
    return raw_key.strip().strip('"').strip("'")

GLOBAL_GROQ_KEY = get_groq_api_key()
print(f"[Pitwall Boot Check] GROQ_API_KEY detected: {'YES (' + GLOBAL_GROQ_KEY[:8] + '...)' if GLOBAL_GROQ_KEY else 'NO - MISSING!'}")

try:
    from groq import Groq
except ImportError:
    Groq = None

CACHE_DIR = ROOT_DIR / "f1_cache"
CACHE_DIR.mkdir(exist_ok=True)
try:
    fastf1.Cache.enable_cache(str(CACHE_DIR))
except Exception as e:
    print(f"[FastF1 Cache Warning]: {e}")

# Real-world local session lighting schedule per Grand Prix & Session
CIRCUIT_TIME_OF_DAY = {
    "Bahrain": {"FP1": "AFTERNOON", "FP2": "NIGHT", "FP3": "AFTERNOON", "Q": "NIGHT", "R": "NIGHT"},
    "Saudi Arabia": {"FP1": "EVENING", "FP2": "NIGHT", "FP3": "EVENING", "Q": "NIGHT", "R": "NIGHT"},
    "Singapore": {"FP1": "EVENING", "FP2": "NIGHT", "FP3": "EVENING", "Q": "NIGHT", "R": "NIGHT"},
    "Las Vegas": {"FP1": "NIGHT", "FP2": "NIGHT", "FP3": "NIGHT", "Q": "NIGHT", "R": "NIGHT"},
    "Qatar": {"FP1": "EVENING", "FP2": "NIGHT", "SQ": "NIGHT", "S": "NIGHT", "Q": "NIGHT", "R": "NIGHT"},
    "Abu Dhabi": {"FP1": "AFTERNOON", "FP2": "EVENING", "FP3": "AFTERNOON", "Q": "EVENING", "R": "NIGHT"},
    "Australia": {"FP1": "MORNING", "FP2": "AFTERNOON", "FP3": "MORNING", "Q": "AFTERNOON", "R": "AFTERNOON"},
    "Miami": {"FP1": "AFTERNOON", "SQ": "AFTERNOON", "S": "MORNING", "Q": "AFTERNOON", "R": "AFTERNOON"},
    "United States": {"FP1": "MORNING", "SQ": "AFTERNOON", "S": "AFTERNOON", "Q": "EVENING", "R": "AFTERNOON"},
}


def _detect_time_of_day(grand_prix: str, session_code: str, f1_sess=None) -> str:
    base_code = session_code.upper().strip()
    if base_code in ("Q1", "Q2", "Q3"):
        base_code = "Q"
    elif base_code in ("SQ1", "SQ2", "SQ3"):
        base_code = "SQ"

    if grand_prix in CIRCUIT_TIME_OF_DAY and base_code in CIRCUIT_TIME_OF_DAY[grand_prix]:
        return CIRCUIT_TIME_OF_DAY[grand_prix][base_code]

    try:
        if f1_sess is not None and hasattr(f1_sess, "session_info") and f1_sess.session_info:
            start_dt = f1_sess.session_info.get("StartDate")
            if start_dt and hasattr(start_dt, "hour"):
                hr = start_dt.hour
                if hr < 12:
                    return "MORNING"
                elif hr < 16:
                    return "AFTERNOON"
                elif hr < 19:
                    return "EVENING"
                else:
                    return "NIGHT"
    except Exception:
        pass

    if base_code in ("FP1", "FP3"):
        return "MORNING"
    return "AFTERNOON"


def get_groq_client():
    key = get_groq_api_key()
    if Groq is not None and key:
        return Groq(api_key=key)
    return None


def _query_groq_direct_http(user_prompt: str, system_prompt: str) -> tuple[str, str]:
    api_key = get_groq_api_key()
    if not api_key:
        return "", "GROQ_API_KEY is empty"

    last_err = ""
    for model_name in ["openai/gpt-oss-120b", "openai/gpt-oss-20b"]:
        try:
            payload = json.dumps({
                "model": model_name,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.35,
                "max_tokens": 4096
            }).encode("utf-8")

            req = urllib.request.Request(
                "https://api.groq.com/openai/v1/chat/completions",
                data=payload,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "User-Agent": "F1PitwallAgent/1.0"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                choices = data.get("choices", [])
                if choices and choices[0].get("message", {}).get("content"):
                    return choices[0]["message"]["content"].strip(), ""
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")
            last_err = f"HTTP {e.code}: {err_body}"
            print(f"[Groq Direct HTTP Error on {model_name}]: {last_err}")
            continue
        except Exception as e:
            last_err = str(e)
            print(f"[Groq Direct HTTP Error on {model_name}]: {last_err}")
            continue
    return "", last_err


def _cleanse_user_query(raw_query: str) -> str:
    return re.sub(r"^\[Context:.*?\]\s*", "", raw_query.strip(), flags=re.DOTALL).strip()


def _route_specialist_badge(clean_query: str) -> str:
    q = clean_query.lower()
    if any(w in q for w in ["tyre", "tire", "pit", "undercut", "overcut", "stint", "compound"]):
        return "HEAD OF RACE STRATEGY"
    if any(w in q for w in ["aero", "downforce", "drs", "wing", "floor", "diffuser", "drag", "active aero"]):
        return "CHIEF AERODYNAMICIST"
    if any(w in q for w in ["engine", "power unit", "mgu", "ers", "battery", "hybrid", "turbo"]):
        return "POWERTRAIN PERFORMANCE CHIEF"
    if any(w in q for w in ["kimi", "antonelli", "driver", "rookie", "champion", "best driver", "2026"]):
        return "DRIVER DEVELOPMENT DIRECTOR"
    return "SENIOR RACE ENGINEER"


async def handle_pitwall_query(user_query: str) -> dict:
    clean_q = _cleanse_user_query(user_query)
    specialist = _route_specialist_badge(clean_q)
    full_prompt = user_query.strip()

   system_prompt = (
        "You are the Senior Pitwall Chief, Chief Race Strategist & Lead Performance Engineer for a Formula 1 team. "
        "You possess absolute, encyclopedic mastery of all Formula 1 history from the 1950s to the present day (2026), "
        "including all eras (Classic, V8, V6 Turbo-Hybrid, and 2026 regulations), every Grand Prix, driver, constructor, "
        "world champion, rule change, and historical statistic. "
        "You are also an expert in F1 physics, vehicle dynamics, tire compounds (Pirelli slicks, intermediates, wets, degradation curves, "
        "operating windows), aerodynamics (ground effect, venturi tunnels, active aero, downforce, drag, DRS, slipstreams), "
        "power units (ICE, MGU-K, MGU-H, energy recovery, thermal efficiency), and telemetric metrics. "
        "Answer all questions—whether historical, technical, physical, strategic, or futuristic—directly, authoritatively, and in character. "
        "When asked for lists or multiple items, generate the complete full list without cutting off prematurely. "
        "Always pay close attention to the [Context: ...] block provided in the user prompt to align with the user's active season."
    )

    api_key = get_groq_api_key()
    if not api_key:
        return {
            "status": "ERROR",
            "specialist": "COMM ERROR",
            "answer": "Radio failure: GROQ_API_KEY is missing from environment variables.",
            "telemetry_data": None
        }

    client = get_groq_client()
    if client:
        for model_name in ["openai/gpt-oss-120b", "openai/gpt-oss-20b"]:
            try:
                chat_completion = client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": full_prompt}
                    ],
                    model=model_name,
                    temperature=0.35,
                    max_tokens=4096
                )
                answer_text = chat_completion.choices[0].message.content.strip()
                if answer_text:
                    return {
                        "status": "SUCCESS",
                        "specialist": specialist,
                        "answer": answer_text,
                        "telemetry_data": None
                    }
            except Exception as e:
                print(f"[Groq SDK Error on {model_name}]: {e}")

    answer_http, last_err = _query_groq_direct_http(full_prompt, system_prompt)
    if answer_http:
        return {
            "status": "SUCCESS",
            "specialist": specialist,
            "answer": answer_http,
            "telemetry_data": None
        }

    return {
        "status": "ERROR",
        "specialist": "COMM ERROR",
        "answer": f"Radio failure: {last_err or 'Groq API key is invalid or expired.'}",
        "telemetry_data": None
    }

def _resolve_fastf1_session(year: int, grand_prix: str, session_code: str):
    code = session_code.upper().strip()
    base_session = code
    sub_segment = None

    if code in ("Q1", "Q2", "Q3"):
        base_session = "Q"
        sub_segment = code
    elif code in ("SQ1", "SQ2", "SQ3"):
        base_session = "SQ"
        sub_segment = code

    try:
        f1_sess = fastf1.get_session(int(year), str(grand_prix), base_session)
    except Exception:
        if base_session == "SQ":
            f1_sess = fastf1.get_session(int(year), str(grand_prix), "SS")
        else:
            raise

    f1_sess.load(telemetry=True, laps=True, weather=False, messages=False)
    laps = f1_sess.laps

    if sub_segment and len(laps) > 0:
        try:
            q1_laps, q2_laps, q3_laps = laps.split_qualifying_sessions()
            if sub_segment.endswith("1") and q1_laps is not None and len(q1_laps) > 0:
                laps = q1_laps
            elif sub_segment.endswith("2") and q2_laps is not None and len(q2_laps) > 0:
                laps = q2_laps
            elif sub_segment.endswith("3") and q3_laps is not None and len(q3_laps) > 0:
                laps = q3_laps
        except Exception:
            pass

    return f1_sess, laps


def _normalize_gps_points(tel_df, target_radius: float = 28.0, max_points: int = 220):
    valid = tel_df.dropna(subset=["X", "Y"])
    if len(valid) < 15:
        return []
    xs = valid["X"].to_numpy(dtype=float)
    ys = valid["Y"].to_numpy(dtype=float)
    cx = (xs.max() + xs.min()) / 2.0
    cy = (ys.max() + ys.min()) / 2.0
    xs_centered = xs - cx
    ys_centered = ys - cy
    span = max(xs_centered.max() - xs_centered.min(), ys_centered.max() - ys_centered.min(), 1.0)
    scale = (target_radius * 2.0) / span
    step = max(1, len(xs_centered) // max_points)
    return [
        {"x": round(float(xs_centered[i] * scale), 3), "z": round(float(-ys_centered[i] * scale), 3)}
        for i in range(0, len(xs_centered), step)
    ]


def _format_laptime(td_val) -> str:
    if pd.isna(td_val):
        return "N/A"
    total_sec = td_val.total_seconds()
    mins = int(total_sec // 60)
    secs = total_sec % 60
    return f"{mins}:{secs:06.3f}"


def _format_sector(td_val) -> str:
    if pd.isna(td_val):
        return "—"
    return f"{td_val.total_seconds():.3f}s"


def fetch_circuit_telemetry(year: int, grand_prix: str, session: str):
    time_of_day = _detect_time_of_day(grand_prix, session, None)
    try:
        f1_sess, laps = _resolve_fastf1_session(year, grand_prix, session)
        time_of_day = _detect_time_of_day(grand_prix, session, f1_sess)
        fastest_lap = laps.pick_fastest()
        if fastest_lap is None or (hasattr(fastest_lap, "empty") and fastest_lap.empty):
            fastest_lap = f1_sess.laps.pick_fastest()

        tel = fastest_lap.get_telemetry().add_distance()
        points = _normalize_gps_points(tel, target_radius=28.0, max_points=220)

        max_dist = float(tel["Distance"].max())
        checkpoints = np.linspace(0, max_dist, 100)
        speeds = np.interp(checkpoints, tel["Distance"], tel["Speed"])
        throttles = np.interp(checkpoints, tel["Distance"], tel["Throttle"])
        brakes = np.interp(checkpoints, tel["Distance"], tel["Brake"].astype(float))
        gears = np.interp(checkpoints, tel["Distance"], tel["nGear"])

        telemetry_trace = []
        for i in range(len(checkpoints)):
            b_val = float(brakes[i])
            if b_val <= 1.0:
                b_val = b_val * 100.0
            telemetry_trace.append({
                "progress": round(i / (len(checkpoints) - 1), 3),
                "speed": int(round(speeds[i])),
                "throttle": int(round(np.clip(throttles[i], 0, 100))),
                "brake": int(round(np.clip(b_val, 0, 100))),
                "gear": int(round(np.clip(gears[i], 1, 8)))
            })

        session_drivers = sorted(list(set(laps["Driver"].dropna().unique().tolist())))
        available_laps = sorted([int(x) for x in laps["LapNumber"].dropna().unique().tolist() if int(x) > 0])
        fastest_drv = str(fastest_lap.get("Driver", "VER"))
        formatted_lt = _format_laptime(fastest_lap["LapTime"])

        return {
            "metadata": f"{year} {grand_prix} - {session}",
            "lap_time": f"{formatted_lt} ({fastest_drv})",
            "raw_lap_time": formatted_lt,
            "fastest_driver": fastest_drv,
            "top_speed": round(float(tel["Speed"].max()), 1),
            "time_of_day": time_of_day,
            "available_laps": available_laps,
            "total_laps": max(available_laps) if available_laps else 1,
            "points": points,
            "telemetry_trace": telemetry_trace,
            "session_drivers": session_drivers
        }
    except Exception as e:
        print(f"[Circuit Telemetry Error]: {e}")
        return {"error": str(e), "points": [], "time_of_day": time_of_day}


def _extract_driver_lap_stats(driver_laps, selected_lap_row, target_lap_num: int) -> dict:
    compound = str(selected_lap_row.get("Compound", "SOFT") or "SOFT").upper()
    if compound in ("NAN", "NONE", "UNKNOWN", ""):
        compound = "MEDIUM"
    tyre_life = int(selected_lap_row.get("TyreLife", 1)) if pd.notna(selected_lap_row.get("TyreLife")) else 1
    stint = int(selected_lap_row.get("Stint", 1)) if pd.notna(selected_lap_row.get("Stint")) else 1

    # Calculate cumulative pit stops up to this lap
    pit_stops = 0
    pit_status = "ON TRACK"
    if len(driver_laps) > 0:
        up_to_lap = driver_laps[driver_laps["LapNumber"] <= target_lap_num]
        if "PitInTime" in up_to_lap.columns:
            pit_stops = int(up_to_lap["PitInTime"].notna().sum())
        elif "Stint" in up_to_lap.columns and pd.notna(up_to_lap["Stint"].max()):
            pit_stops = max(0, int(up_to_lap["Stint"].max()) - 1)

        if pd.notna(selected_lap_row.get("PitInTime")):
            pit_status = "BOXING THIS LAP (PIT IN)"
        elif pd.notna(selected_lap_row.get("PitOutTime")):
            pit_status = "OUT LAP (PIT EXIT)"

    # Estimate remaining tyre life % based on compound wear curve
    max_wear_laps = {"SOFT": 22, "MEDIUM": 34, "HARD": 48, "INTERMEDIATE": 30, "WET": 35}.get(compound, 30)
    tyre_health_pct = max(8, min(100, int(round(100 - (tyre_life / max_wear_laps) * 85))))

    return {
        "compound": compound,
        "tyre_life_laps": tyre_life,
        "tyre_health_pct": tyre_health_pct,
        "stint": stint,
        "pit_stops": pit_stops,
        "pit_status": pit_status,
        "s1": _format_sector(selected_lap_row.get("Sector1Time")),
        "s2": _format_sector(selected_lap_row.get("Sector2Time")),
        "s3": _format_sector(selected_lap_row.get("Sector3Time")),
        "speed_trap": round(float(selected_lap_row.get("SpeedST", 0.0)), 1) if pd.notna(selected_lap_row.get("SpeedST")) else None
    }


def run_compare_telemetry(
    year: int,
    grand_prix: str,
    session: str,
    driver_a: str,
    driver_b: str,
    lap_number: int = None
):
    try:
        f1_sess, laps = _resolve_fastf1_session(year, grand_prix, session)
        time_of_day = _detect_time_of_day(grand_prix, session, f1_sess)
        laps_a = laps.pick_drivers(driver_a) if hasattr(laps, "pick_drivers") else laps.pick_driver(driver_a)
        laps_b = laps.pick_drivers(driver_b) if hasattr(laps, "pick_drivers") else laps.pick_driver(driver_b)

        all_laps_a = [int(x) for x in laps_a["LapNumber"].dropna().unique().tolist() if int(x) > 0] if len(laps_a) > 0 else []
        all_laps_b = [int(x) for x in laps_b["LapNumber"].dropna().unique().tolist() if int(x) > 0] if len(laps_b) > 0 else []
        available_laps = sorted(list(set(all_laps_a).union(set(all_laps_b))))

        is_race_session = session.upper().strip() in ("R", "S", "RACE", "SPRINT")
        lap_a = None
        lap_b = None
        on_track_gap_sec = 0.0
        selected_lap_num = lap_number

        # If a specific lap number is requested by the user (from Scrubber or Modal Dropdown)
        if selected_lap_num is not None and int(selected_lap_num) > 0:
            target_num = int(selected_lap_num)
            cand_a = laps_a[laps_a["LapNumber"] == target_num] if len(laps_a) > 0 else pd.DataFrame()
            cand_b = laps_b[laps_b["LapNumber"] == target_num] if len(laps_b) > 0 else pd.DataFrame()
            if len(cand_a) > 0:
                lap_a = cand_a.iloc[0]
            if len(cand_b) > 0:
                lap_b = cand_b.iloc[0]

        # Otherwise, in Race/Sprint mode, pick a representative common lap
        if lap_a is None and is_race_session and len(laps_a) > 0 and len(laps_b) > 0:
            common_laps = sorted(list(set(all_laps_a).intersection(set(all_laps_b))))
            if common_laps:
                target_num = common_laps[len(common_laps) // 2]
                selected_lap_num = target_num
                cand_a = laps_a[laps_a["LapNumber"] == target_num]
                cand_b = laps_b[laps_b["LapNumber"] == target_num]
                if len(cand_a) > 0 and len(cand_b) > 0:
                    lap_a = cand_a.iloc[0]
                    lap_b = cand_b.iloc[0]

        if lap_a is None:
            lap_a = laps_a.pick_fastest() if len(laps_a) > 0 else f1_sess.laps.pick_fastest()
        if lap_b is None:
            lap_b = laps_b.pick_fastest() if len(laps_b) > 0 else f1_sess.laps.pick_fastest()

        actual_lap_num_a = int(lap_a.get("LapNumber", 1)) if pd.notna(lap_a.get("LapNumber")) else 1
        actual_lap_num_b = int(lap_b.get("LapNumber", 1)) if pd.notna(lap_b.get("LapNumber")) else 1
        active_lap_label = f"LAP {selected_lap_num}" if selected_lap_num else f"FASTEST (L{actual_lap_num_a}/L{actual_lap_num_b})"

        if pd.notna(lap_a.get("Time")) and pd.notna(lap_b.get("Time")) and (is_race_session or selected_lap_num):
            on_track_gap_sec = float((lap_b["Time"] - lap_a["Time"]).total_seconds())

        stats_a = _extract_driver_lap_stats(laps_a, lap_a, actual_lap_num_a)
        stats_b = _extract_driver_lap_stats(laps_b, lap_b, actual_lap_num_b)

        tel_a = lap_a.get_telemetry().add_distance()
        tel_b = lap_b.get_telemetry().add_distance()
        max_dist = max(min(float(tel_a["Distance"].max()), float(tel_b["Distance"].max())), 1.0)
        dist_checkpoints = np.linspace(0, max_dist, 100)

        speed_a = np.interp(dist_checkpoints, tel_a["Distance"], tel_a["Speed"])
        speed_b = np.interp(dist_checkpoints, tel_b["Distance"], tel_b["Speed"])
        throttle_a = np.interp(dist_checkpoints, tel_a["Distance"], tel_a["Throttle"])
        throttle_b = np.interp(dist_checkpoints, tel_b["Distance"], tel_b["Throttle"])
        brake_a = np.interp(dist_checkpoints, tel_a["Distance"], tel_a["Brake"].astype(float))
        brake_b = np.interp(dist_checkpoints, tel_b["Distance"], tel_b["Brake"].astype(float))
        gear_a = np.interp(dist_checkpoints, tel_a["Distance"], tel_a["nGear"])
        gear_b = np.interp(dist_checkpoints, tel_b["Distance"], tel_b["nGear"])

        elapsed_a = np.interp(dist_checkpoints, tel_a["Distance"], tel_a["Time"].dt.total_seconds())
        elapsed_b = np.interp(dist_checkpoints, tel_b["Distance"], tel_b["Time"].dt.total_seconds())

        time_a = float(lap_a["LapTime"].total_seconds()) if not pd.isna(lap_a["LapTime"]) else float(elapsed_a[-1])
        time_b = float(lap_b["LapTime"].total_seconds()) if not pd.isna(lap_b["LapTime"]) else float(elapsed_b[-1])
        total_delta = round(time_b - time_a, 3)

        if time_a <= time_b:
            duel_fastest_str = f"{_format_laptime(lap_a['LapTime'])} ({driver_a})"
            duel_fastest_driver = driver_a
        else:
            duel_fastest_str = f"{_format_laptime(lap_b['LapTime'])} ({driver_b})"
            duel_fastest_driver = driver_b

        chart_data = []
        dominance_map = []
        total_lap_time_b = max(float(elapsed_b[-1]), 1.0)

        for i in range(len(dist_checkpoints)):
            faster = "A" if speed_a[i] >= speed_b[i] else "B"
            dominance_map.append(faster)
            b_val_a = float(brake_a[i]) * 100.0 if float(brake_a[i]) <= 1.0 else float(brake_a[i])
            b_val_b = float(brake_b[i]) * 100.0 if float(brake_b[i]) <= 1.0 else float(brake_b[i])

            inst_delta = round(float(elapsed_b[i] - elapsed_a[i]), 3)

            if (is_race_session or selected_lap_num) and abs(on_track_gap_sec) > 0.05 and abs(on_track_gap_sec) < 120.0:
                t_b_now = (elapsed_a[i] - on_track_gap_sec) % total_lap_time_b
                dist_b_now = float(np.interp(t_b_now, elapsed_b, dist_checkpoints))
                norm_b_val = round(dist_b_now / max_dist, 4)
            else:
                t_b_now = np.clip(elapsed_a[i] - (inst_delta * 2.5), 0.0, total_lap_time_b)
                dist_b_now = float(np.interp(t_b_now, elapsed_b, dist_checkpoints))
                norm_b_val = round(np.clip(dist_b_now / max_dist, 0.0, 1.0), 4)

            chart_data.append({
                "distance": int(dist_checkpoints[i]),
                "speed_a": round(float(speed_a[i]), 1),
                "speed_b": round(float(speed_b[i]), 1),
                "throttle_a": int(round(np.clip(throttle_a[i], 0, 100))),
                "throttle_b": int(round(np.clip(throttle_b[i], 0, 100))),
                "brake_a": int(round(np.clip(b_val_a, 0, 100))),
                "brake_b": int(round(np.clip(b_val_b, 0, 100))),
                "gear_a": int(round(np.clip(gear_a[i], 1, 8))),
                "gear_b": int(round(np.clip(gear_b[i], 1, 8))),
                "faster": faster,
                "delta_running": inst_delta,
                "on_track_gap": round(on_track_gap_sec + inst_delta, 3) if is_race_session else inst_delta,
                "norm_b": norm_b_val
            })

        return {
            "driver_a": driver_a,
            "driver_b": driver_b,
            "selected_lap": selected_lap_num,
            "active_lap_label": active_lap_label,
            "available_laps": available_laps,
            "time_of_day": time_of_day,
            "delta_sec": total_delta,
            "on_track_gap_sec": round(on_track_gap_sec, 3),
            "fastest_lap": duel_fastest_str,
            "fastest_driver": duel_fastest_driver,
            "lap_time_a": f"{_format_laptime(lap_a['LapTime'])} ({driver_a})",
            "lap_time_b": f"{_format_laptime(lap_b['LapTime'])} ({driver_b})",
            "top_speed_a": round(float(tel_a["Speed"].max()), 1),
            "top_speed_b": round(float(tel_b["Speed"].max()), 1),
            "stats_a": stats_a,
            "stats_b": stats_b,
            "chart_points": chart_data,
            "dominance_map": dominance_map
        }
    except Exception as e:
        print(f"[Compare Telemetry Error]: {e}")
        raise ValueError(str(e))

# ── 2026 22-CAR FULL GRID & UPCOMING LIVE BROADCAST SCHEDULE ENGINE ──
UPCOMING_2026_LIVE_RACES = [
    {"round": 21, "circuit": "Brazil", "name": "São Paulo Grand Prix", "start_ist": "2026-11-08 22:30 IST", "total_laps": 71},
    {"round": 22, "circuit": "Las Vegas", "name": "Las Vegas Grand Prix", "start_ist": "2026-11-22 11:30 IST", "total_laps": 50},
    {"round": 23, "circuit": "Qatar", "name": "Qatar Grand Prix", "start_ist": "2026-11-29 21:30 IST", "total_laps": 57},
    {"round": 24, "circuit": "Abu Dhabi", "name": "Abu Dhabi Grand Prix", "start_ist": "2026-12-06 18:30 IST", "total_laps": 58},
]

GRID_2026_22_CARS = [
    {"code": "VER", "number": "1",  "name": "Max Verstappen",    "team": "Red Bull Racing",   "color": "#06142e", "compound": "MEDIUM", "base_pace": 1.000},
    {"code": "NOR", "number": "4",  "name": "Lando Norris",      "team": "McLaren",           "color": "#ff8000", "compound": "MEDIUM", "base_pace": 0.999},
    {"code": "LEC", "number": "16", "name": "Charles Leclerc",   "team": "Scuderia Ferrari",  "color": "#dc2626", "compound": "SOFT",   "base_pace": 0.998},
    {"code": "HAM", "number": "44", "name": "Lewis Hamilton",    "team": "Scuderia Ferrari",  "color": "#dc2626", "compound": "HARD",   "base_pace": 0.997},
    {"code": "PIA", "number": "81", "name": "Oscar Piastri",     "team": "McLaren",           "color": "#ff8000", "compound": "MEDIUM", "base_pace": 0.996},
    {"code": "RUS", "number": "63", "name": "George Russell",    "team": "Mercedes-AMG",      "color": "#00a19c", "compound": "MEDIUM", "base_pace": 0.995},
    {"code": "ANT", "number": "12", "name": "Kimi Antonelli",    "team": "Mercedes-AMG",      "color": "#00a19c", "compound": "SOFT",   "base_pace": 0.994},
    {"code": "SAI", "number": "55", "name": "Carlos Sainz",      "team": "Williams",          "color": "#004fd4", "compound": "MEDIUM", "base_pace": 0.992},
    {"code": "LAW", "number": "30", "name": "Liam Lawson",       "team": "Red Bull Racing",   "color": "#06142e", "compound": "HARD",   "base_pace": 0.991},
    {"code": "ALO", "number": "14", "name": "Fernando Alonso",   "team": "Aston Martin",      "color": "#00594f", "compound": "MEDIUM", "base_pace": 0.990},
    {"code": "ALB", "number": "23", "name": "Alex Albon",        "team": "Williams",          "color": "#004fd4", "compound": "HARD",   "base_pace": 0.989},
    {"code": "GAS", "number": "10", "name": "Pierre Gasly",      "team": "Alpine",            "color": "#0072bb", "compound": "MEDIUM", "base_pace": 0.988},
    {"code": "TSU", "number": "22", "name": "Yuki Tsunoda",      "team": "Racing Bulls",      "color": "#1e40af", "compound": "SOFT",   "base_pace": 0.987},
    {"code": "HUL", "number": "27", "name": "Nico Hulkenberg",   "team": "Audi / Sauber",     "color": "#22c55e", "compound": "MEDIUM", "base_pace": 0.986},
    {"code": "OCO", "number": "31", "name": "Esteban Ocon",      "team": "Haas F1 Team",      "color": "#f8fafc", "compound": "HARD",   "base_pace": 0.985},
    {"code": "STR", "number": "18", "name": "Lance Stroll",      "team": "Aston Martin",      "color": "#00594f", "compound": "HARD",   "base_pace": 0.984},
    {"code": "BEA", "number": "87", "name": "Oliver Bearman",    "team": "Haas F1 Team",      "color": "#f8fafc", "compound": "MEDIUM", "base_pace": 0.983},
    {"code": "HAD", "number": "6",  "name": "Isack Hadjar",      "team": "Racing Bulls",      "color": "#1e40af", "compound": "MEDIUM", "base_pace": 0.982},
    {"code": "DOO", "number": "7",  "name": "Jack Doohan",       "team": "Alpine",            "color": "#0072bb", "compound": "SOFT",   "base_pace": 0.981},
    {"code": "BOR", "number": "5",  "name": "Gabriel Bortoleto", "team": "Audi / Sauber",     "color": "#22c55e", "compound": "MEDIUM", "base_pace": 0.980},
    {"code": "PER", "number": "11", "name": "Sergio Perez",      "team": "Cadillac F1 Team",  "color": "#eab308", "compound": "MEDIUM", "base_pace": 0.979},
    {"code": "BOT", "number": "77", "name": "Valtteri Bottas",   "team": "Cadillac F1 Team",  "color": "#eab308", "compound": "HARD",   "base_pace": 0.978},
]


def fetch_live_22_car_broadcast_state(
    year: int,
    grand_prix: str,
    tick: float = 0.0,
    override_flag: str = None
) -> dict:
    """
    Streams or simulates all 22 cars on track with live FIA Race Control flags
    (GREEN, SAFETY_CAR, RED_FLAG, CRASH), intervals, tyre compounds, and Safety Car position.
    """
    matched_race = next(
        (r for r in UPCOMING_2026_LIVE_RACES if r["circuit"].lower() == grand_prix.lower()),
        UPCOMING_2026_LIVE_RACES[0]
    )

    # Determine active FIA Track Status Flag
    if override_flag and override_flag in ("GREEN", "SAFETY_CAR", "RED_FLAG", "CRASH", "FORMATION_START"):
        track_flag = override_flag
    else:
        track_flag = "GREEN"

    current_lap = min(matched_race["total_laps"], max(1, int(tick // 28) + 1))
    safety_car_progress = round((tick * 0.018) % 1.0, 4)
    crash_progress = 0.38  # Sector 2 incident zone if CRASH / SAFETY_CAR is triggered

    standings = []
    for idx, drv in enumerate(GRID_2026_22_CARS):
        if track_flag == "FORMATION_START":
            # Lined up in 22 staggered grid slots behind the starting gantry
            prog = (1.0 - (idx + 1) * 0.007) % 1.0
            spd = 0
            gap_str = "GRID"
        elif track_flag == "RED_FLAG":
            # Parked in pitlane queue under Red Flag stoppage
            prog = (0.98 - idx * 0.005) % 1.0
            spd = 0
            gap_str = "RED FLAG"
        elif track_flag == "CRASH" and idx == 18:
            # Car #19 (DOO) stopped at crash site in Sector 2 with hazard beacons
            prog = crash_progress
            spd = 0
            gap_str = "OUT / CRASH"
        elif track_flag in ("SAFETY_CAR", "CRASH"):
            # Bunched up behind the FIA Safety Car queue
            prog = (safety_car_progress - (idx + 1) * 0.011 + 1.0) % 1.0
            spd = 168
            gap_str = "SC QUEUE" if idx == 0 else f"+{(idx * 0.42):.3f}s"
        else:
            # Green flag racing with dynamic overtakes and slipstream battles
            wave = np.sin(tick * 0.15 + idx * 0.9) * 0.006
            prog = ((tick * 0.032 * drv["base_pace"]) - (idx * 0.016) + wave) % 1.0
            spd = int(round(215 + 115 * abs(np.sin(prog * np.pi * 5 + idx))))
            gap_sec = round(idx * 1.18 + abs(wave * 15.0), 3)
            gap_str = "LEADER" if idx == 0 else f"+{gap_sec:.3f}s"

        standings.append({
            "pos": idx + 1,
            "code": drv["code"],
            "number": drv["number"],
            "name": drv["name"],
            "team": drv["team"],
            "color": drv["color"],
            "compound": drv["compound"],
            "progress": round(float(prog), 4),
            "speed": spd,
            "gap": gap_str,
            "in_crash": (track_flag == "CRASH" and idx == 18)
        })

    return {
        "status": "LIVE_SYNCED",
        "race_name": matched_race["name"],
        "circuit": matched_race["circuit"],
        "scheduled_start_ist": matched_race["start_ist"],
        "current_lap": current_lap,
        "total_laps": matched_race["total_laps"],
        "track_flag": track_flag,
        "safety_car_active": track_flag in ("SAFETY_CAR", "CRASH"),
        "safety_car_progress": safety_car_progress,
        "crash_zone_progress": crash_progress if track_flag == "CRASH" else None,
        "upcoming_loop": UPCOMING_2026_LIVE_RACES,
        "cars": standings
    }