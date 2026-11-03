import os
os.environ["FASTF1_NO_AUTH"] = "1"

from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from f1_pitwall_orchestrator import (
    handle_pitwall_query,
    fetch_circuit_telemetry,
    run_compare_telemetry,
    fetch_live_22_car_broadcast_state
)

app = FastAPI(title="F1 Pitwall Multi-Season Telemetry & Strategy Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SessionRequest(BaseModel):
    grand_prix: str
    year: int = 2024
    session: str = "Q"
    driver_a: Optional[str] = "LEC"
    driver_b: Optional[str] = "NOR"
    lap_number: Optional[int] = None


class LiveRaceRequest(BaseModel):
    grand_prix: str = "Brazil"
    year: int = 2026
    tick: float = 0.0
    override_flag: Optional[str] = None


class RadioRequest(BaseModel):
    query: str


@app.post("/api/circuit")
def get_circuit_data(req: SessionRequest):
    data = fetch_circuit_telemetry(req.year, req.grand_prix, req.session)
    if not data or not data.get("points"):
        return {
            "metadata": f"{req.year} {req.grand_prix} - {req.session}",
            "points": [],
            "error": data.get("error", "Using built-in high-precision circuit geometry")
        }
    return data


@app.post("/api/compare")
def compare_telemetry(req: SessionRequest):
    try:
        return run_compare_telemetry(
            req.year,
            req.grand_prix,
            req.session,
            req.driver_a or "LEC",
            req.driver_b or "NOR",
            req.lap_number
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/live_grid")
def live_grid_endpoint(req: LiveRaceRequest):
    return fetch_live_22_car_broadcast_state(
        req.year,
        req.grand_prix,
        req.tick,
        req.override_flag
    )


@app.post("/api/radio")
async def radio_endpoint(req: RadioRequest):
    return await handle_pitwall_query(req.query)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)