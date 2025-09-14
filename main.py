from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from typing import List, Optional
import uvicorn
from datetime import date
import json
import os
import uuid

from type import PublicFunding, MyCompany

app = FastAPI(title="Look 4 Fundings", description="A web application for companies to review and manage funding grants")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

# In-memory storage (will be replaced with database later)
grants_db: List[PublicFunding] = [
    PublicFunding(
        title="Innovation in Clean Technology Grant",
        url="https://example.com/clean-tech-grant",
        summary="A comprehensive funding opportunity for companies developing sustainable and clean technology solutions. This grant supports innovative projects that address environmental challenges and promote green energy initiatives.",
        deadline=date(2024, 3, 15),
        status="Open",
        budget="$50,000 - $200,000",
        company_affinity=85.0,
        won=False
    ),
    PublicFunding(
        title="Small Business Innovation Research (SBIR) Phase I",
        url="https://example.com/sbir-phase1",
        summary="Federal funding program that provides small businesses with opportunities to propose innovative research and development projects. Focus on technology commercialization and market potential.",
        deadline=date(2024, 4, 30),
        status="Upcoming",
        budget="$150,000",
        company_affinity=92.0,
        won=True
    ),
    PublicFunding(
        title="Digital Transformation Accelerator",
        url="https://example.com/digital-transformation",
        summary="Supporting companies in their digital transformation journey with funding for technology adoption, process optimization, and digital infrastructure development.",
        deadline=date(2024, 2, 28),
        status="Closed",
        budget="$25,000 - $100,000",
        company_affinity=67.0,
        won=False
    )
]
company_profile: Optional[MyCompany] = None

@app.get("/", response_class=HTMLResponse)
async def landing_page(request: Request):
    """Landing page with list of grants"""
    return templates.TemplateResponse("index.html", {
        "request": request,
        "grants": grants_db,
        "company": company_profile
    })

@app.get("/profile", response_class=HTMLResponse)
async def profile_page(request: Request):
    """Company profile page"""
    return templates.TemplateResponse("profile.html", {
        "request": request,
        "company": company_profile
    })

# API endpoints
@app.get("/api/grants", response_model=List[PublicFunding])
async def get_grants():
    """Get all grants"""
    # Ensure all grants have the won field
    for grant in grants_db:
        if not hasattr(grant, 'won'):
            grant.won = False
    return grants_db

@app.delete("/api/grants/clear")
async def clear_all_grants():
    """Clear all grants (for debugging)"""
    global grants_db
    grants_db.clear()
    return {"message": "All grants cleared"}

@app.post("/api/grants", response_model=PublicFunding)
async def create_grant(grant: PublicFunding):
    """Create a new grant"""
    # Add a unique ID to the grant
    grant_dict = grant.dict()
    grant_dict['id'] = str(uuid.uuid4())
    grants_db.append(PublicFunding(**grant_dict))
    return PublicFunding(**grant_dict)

@app.delete("/api/grants/{grant_id}")
async def delete_grant(grant_id: int):
    """Delete a grant by index"""
    if grant_id < 0 or grant_id >= len(grants_db):
        raise HTTPException(status_code=404, detail="Grant not found")
    deleted_grant = grants_db.pop(grant_id)
    return {"message": "Grant deleted successfully", "grant": deleted_grant}

@app.patch("/api/grants/{grant_id}/won")
async def toggle_grant_won_status(grant_id: int):
    """Toggle the won status of a grant by index"""
    if grant_id < 0 or grant_id >= len(grants_db):
        raise HTTPException(status_code=404, detail="Grant not found")
    
    # Toggle the won status
    grants_db[grant_id].won = not grants_db[grant_id].won
    return {"message": "Grant won status updated", "grant": grants_db[grant_id]}

@app.get("/api/company", response_model=Optional[MyCompany])
async def get_company():
    """Get company profile"""
    return company_profile

@app.post("/api/company", response_model=MyCompany)
async def update_company(company: MyCompany):
    """Update company profile"""
    global company_profile
    company_profile = company
    return company

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
