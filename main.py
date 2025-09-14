from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, FileResponse
from typing import List, Optional
import uvicorn
from datetime import date, datetime
import os
import uuid
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from type import PublicFunding, MyCompany

app = FastAPI(
    title="Look 4 Fundings",
    description="A web application for companies to review and manage funding grants",
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    # Ensure reports directory exists
    os.makedirs("static/reports", exist_ok=True)
    print("Application started successfully")

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
        won=False,
    ),
    PublicFunding(
        title="Small Business Innovation Research (SBIR) Phase I",
        url="https://example.com/sbir-phase1",
        summary="Federal funding program that provides small businesses with opportunities to propose innovative research and development projects. Focus on technology commercialization and market potential.",
        deadline=date(2024, 4, 30),
        status="Upcoming",
        budget="$150,000",
        company_affinity=92.0,
        won=True,
    ),
    PublicFunding(
        title="Digital Transformation Accelerator",
        url="https://example.com/digital-transformation",
        summary="Supporting companies in their digital transformation journey with funding for technology adoption, process optimization, and digital infrastructure development.",
        deadline=date(2024, 2, 28),
        status="Closed",
        budget="$25,000 - $100,000",
        company_affinity=67.0,
        won=False,
    ),
]

# Reports storage
reports_db: List[dict] = []

company_profile: Optional[MyCompany] = None


@app.get("/", response_class=HTMLResponse)
async def landing_page(request: Request):
    """Landing page with list of grants"""
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "grants": grants_db, "company": company_profile},
    )


@app.get("/profile", response_class=HTMLResponse)
async def profile_page(request: Request):
    """Company profile page"""
    return templates.TemplateResponse(
        "profile.html", {"request": request, "company": company_profile}
    )


@app.get("/reports", response_class=HTMLResponse)
async def reports_page(request: Request):
    """Reports page"""
    return templates.TemplateResponse(
        "reports.html", {"request": request, "reports": reports_db}
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for deployment platforms"""
    return {"status": "healthy", "message": "Look 4 Fundings API is running"}

# API endpoints
@app.get("/api/grants", response_model=List[PublicFunding])
async def get_grants():
    """Get all grants"""
    # Ensure all grants have the won field
    for grant in grants_db:
        if not hasattr(grant, "won"):
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
    grant_dict["id"] = str(uuid.uuid4())
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


# Reports API endpoints
@app.get("/api/reports")
async def get_reports():
    """Get all reports"""
    return reports_db


@app.post("/api/reports/generate")
async def generate_report(request: dict):
    """Generate a new report"""
    report_type = request.get("type", "generated")
    content = request.get("content", "")

    # Generate report content
    if report_type == "generated":
        # Generate from website data
        won_grants = [grant for grant in grants_db if grant.won]
        report_content = create_generated_report_content(company_profile, won_grants)
        report_name = "Generated Report"
    else:  # API type
        # Use provided content
        report_content = create_api_report_content(content)
        report_name = "API Report"

    # Generate PDF
    report_id = str(uuid.uuid4())
    filename = f"report_{report_id}.pdf"
    filepath = f"static/reports/{filename}"

    # Ensure reports directory exists
    os.makedirs("static/reports", exist_ok=True)

    # Create PDF
    create_pdf_report(filepath, report_content, report_type)

    # Get file size
    file_size = os.path.getsize(filepath)

    # Create report record
    report = {
        "id": report_id,
        "name": report_name,
        "description": content if report_type == "api" else "",
        "type": report_type,
        "filename": filename,
        "filepath": filepath,
        "file_size": file_size,
        "generated_at": datetime.now().isoformat(),
    }

    reports_db.append(report)
    return report


@app.get("/api/reports/{report_id}/download")
async def download_report(report_id: str):
    """Download a report by ID"""
    report = next((r for r in reports_db if r["id"] == report_id), None)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return FileResponse(
        report["filepath"], 
        media_type="application/pdf", 
        filename=report["filename"],
        headers={"Content-Disposition": f"attachment; filename={report['filename']}"}
    )


@app.delete("/api/reports/{report_id}")
async def delete_report(report_id: str):
    """Delete a report by ID"""
    global reports_db
    report = next((r for r in reports_db if r["id"] == report_id), None)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Remove file if it exists
    if os.path.exists(report["filepath"]):
        os.remove(report["filepath"])

    # Remove from database
    reports_db = [r for r in reports_db if r["id"] != report_id]
    return {"message": "Report deleted successfully"}


# Helper functions for report generation
def create_generated_report_content(
    company: Optional[MyCompany], won_grants: List[PublicFunding]
) -> dict:
    """Create report content from website data"""
    # Calculate total funding secured
    total_funding = 0
    for grant in won_grants:
        if grant.budget and "$" in grant.budget:
            try:
                # Extract first number from budget range
                budget_str = (
                    grant.budget.replace("$", "").replace(",", "").split("-")[0].strip()
                )
                total_funding += float(budget_str)
            except:
                pass

    # Calculate success rate
    success_rate = (len(won_grants) / len(grants_db) * 100) if grants_db else 0

    return {
        "title": "Company Report",
        "sections": [
            {
                "title": "Company Information",
                "content": f"Name: {company.name if company else 'Not specified'}\nWebsite: {company.url if company else 'Not specified'}\nScope: {company.scope if company else 'Not specified'}",
            },
            {
                "title": "Grant Statistics",
                "content": f"Total Grants Applied: {len(grants_db)}\nWon Grants: {len(won_grants)}\nSuccess Rate: {success_rate:.1f}%\nTotal Funding Secured: ${total_funding:,.2f}",
            },
            {
                "title": "Won Grants",
                "content": "\n".join(
                    [
                        f"• {grant.title}\n  Budget: {grant.budget}\n  Deadline: {grant.deadline}\n  Affinity: {grant.company_affinity}%\n"
                        for grant in won_grants
                    ]
                )
                if won_grants
                else "No grants won yet",
            },
        ],
    }


def create_api_report_content(content: str) -> dict:
    """Create report content from API text input"""
    return {
        "title": "API Generated Report",
        "sections": [{"title": "Report Content", "content": content}],
    }


def create_pdf_report(filepath: str, content: dict, report_type: str):
    """Create PDF report using ReportLab"""
    doc = SimpleDocTemplate(filepath, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=24,
        spaceAfter=30,
        alignment=1,  # Center alignment
    )
    story.append(Paragraph(content["title"], title_style))
    story.append(Spacer(1, 20))

    # Add sections
    for section in content["sections"]:
        story.append(Paragraph(section["title"], styles["Heading2"]))
        story.append(Spacer(1, 12))
        story.append(Paragraph(section["content"], styles["Normal"]))
        story.append(Spacer(1, 20))

    # Build PDF
    doc.build(story)


if __name__ == "__main__":
    import os

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
