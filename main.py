from fastapi import FastAPI, HTTPException, Request, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, FileResponse
from typing import List, Optional
import uvicorn
from datetime import date, datetime
import os
import uuid
import fitz  # PyMuPDF
import requests
import json
from dotenv import load_dotenv
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from contextlib import asynccontextmanager

from type import PublicFunding, MyCompany

# Load environment variables
load_dotenv()

# Configuration
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"

# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize application on startup"""
    try:
        # Ensure reports directory exists
        os.makedirs("static/reports", exist_ok=True)
        print("Application started successfully")
        print(f"Mistral API key configured: {'Yes' if MISTRAL_API_KEY else 'No'}")
    except Exception as e:
        print(f"Error during startup: {e}")
        raise
    yield
    # Cleanup code can go here if needed

app = FastAPI(
    title="Look 4 Fundings",
    description="A web application for companies to review and manage funding grants",
    lifespan=lifespan
)

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


@app.get("/api/status")
async def api_status():
    """Simple API status endpoint"""
    return {"status": "ok", "message": "API is running"}


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


@app.get("/mcp-setup", response_class=HTMLResponse)
async def mcp_setup_page(request: Request):
    """MCP Setup page"""
    return templates.TemplateResponse(
        "mcp-setup.html", {"request": request}
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for deployment platforms"""
    try:
        return {
            "status": "healthy", 
            "message": "Look 4 Fundings API is running",
            "mistral_configured": bool(MISTRAL_API_KEY),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

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


@app.post("/api/company/upload-pdf", response_model=MyCompany)
async def upload_company_pdf(pdf_file: UploadFile = File(...)):
    """Upload and analyze company PDF to extract information"""
    # Validate file type
    if not pdf_file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Extract text from PDF
    text_content = extract_text_from_pdf(pdf_file)
    
    if not text_content.strip():
        raise HTTPException(status_code=400, detail="No text content found in PDF")
    
    # Analyze with Mistral
    company_info = analyze_company_with_mistral(text_content)
    
    # Update global company profile
    global company_profile
    company_profile = company_info
    
    return company_info


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


def extract_text_from_pdf(pdf_file: UploadFile) -> str:
    """Extract text from PDF using PyMuPDF"""
    try:
        # Read PDF content
        pdf_content = pdf_file.file.read()
        
        # Open PDF with PyMuPDF
        pdf_document = fitz.open(stream=pdf_content, filetype="pdf")
        text_content = ""
        
        # Extract text from all pages
        for page_num in range(pdf_document.page_count):
            page = pdf_document[page_num]
            text_content += page.get_text()
        
        pdf_document.close()
        return text_content
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error extracting text from PDF: {str(e)}")


def analyze_company_with_mistral(text_content: str) -> MyCompany:
    """Analyze company information using Mistral AI"""
    if not MISTRAL_API_KEY:
        raise HTTPException(status_code=500, detail="Mistral API key not configured")
    
    # Create the prompt with the company structure
    company_schema = {
        "name": "string - Company name",
        "url": "string - Company website URL", 
        "scope": "string - Company scope/description"
    }
    
    prompt = f"""
    Analyze the following company document and extract the company information in the exact JSON format specified below.
    
    Company Information Schema:
    {json.dumps(company_schema, indent=2)}
    
    Document Content:
    {text_content}
    
    Please extract the company information and return ONLY a valid JSON object matching the schema above.
    If any information is not available in the document, use "Not specified" as the value.
    """
    
    try:
        headers = {
            "Authorization": f"Bearer {MISTRAL_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "mistral-large-latest",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.1,
            "max_tokens": 1000
        }
        
        response = requests.post(MISTRAL_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        
        result = response.json()
        extracted_text = result["choices"][0]["message"]["content"]
        
        # Parse the JSON response
        try:
            company_data = json.loads(extracted_text)
            return MyCompany(**company_data)
        except json.JSONDecodeError:
            # If JSON parsing fails, try to extract JSON from the response
            import re
            json_match = re.search(r'\{.*\}', extracted_text, re.DOTALL)
            if json_match:
                company_data = json.loads(json_match.group())
                return MyCompany(**company_data)
            else:
                raise HTTPException(status_code=500, detail="Failed to parse company information from AI response")
                
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error calling Mistral API: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing company information: {str(e)}")


if __name__ == "__main__":
    import os
    import sys

    try:
        print("🚀 Starting Look 4 Fundings application...")
        print(f"Python version: {sys.version}")
        print(f"Working directory: {os.getcwd()}")
        
        port = int(os.environ.get("PORT", 8000))
        print(f"Starting server on port {port}")
        
        uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
    except Exception as e:
        print(f"❌ Failed to start application: {e}")
        sys.exit(1)