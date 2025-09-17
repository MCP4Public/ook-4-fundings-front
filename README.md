# Look 4 Fundings

A modern web application for companies to discover, manage, and track funding opportunities. Built with FastAPI and modern frontend technologies.

## Features

- **Grant Management**: Add, view, and delete funding opportunities
- **Won Status Tracking**: Mark grants as won or not won with visual indicators
- **Expandable Cards**: Click to expand grant cards for detailed information
- **Company Profile**: Manage your company information for better recommendations
- **AI-Powered PDF Analysis**: Upload company PDFs and automatically extract information using Mistral AI
- **Professional Reports**: Generate PDF reports from company data and won grants
- **Report Types**: 
  - Generated reports (from website data)
  - API reports (from custom LLM content)
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Instant updates when adding, removing, or updating grants
- **Visual Indicators**: Clear badges and icons for grant status and won status

## Quick Start

### Prerequisites

- Python 3.12 or higher
- uv (recommended) or pip
- Mistral AI API key (for PDF analysis feature)

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/YOUR_ORG/look-4-fundings-front.git
cd look-4-fundings-front
```

2. Install dependencies:
```bash
# Using uv (recommended)
uv sync

# Or using pip
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
# Create a .env file in the project root
echo "MISTRAL_API_KEY=your_mistral_api_key_here" > .env
```

4. Run the application:
```bash
# Using uv
uv run python main.py

# Or directly
python main.py
```

5. Open your browser and navigate to `http://localhost:8000`

## Usage

### Landing Page
- View all your saved funding opportunities
- Click the "Add New Grant" button to add a new funding opportunity
- Click on grant cards to expand and see full details
- Toggle won status by clicking the checkmark icon (✓ for won, ○ for not won)
- Use the delete button (trash icon) to remove grants
- Won grants display a green "Won" badge with trophy icon

### Company Profile
- Click the "Profile" button in the navigation
- **Manual Entry**: Fill in your company information (name, website, scope) manually
- **AI-Powered PDF Analysis**: 
  - Click "Upload PDF" button to open the upload modal
  - Upload a PDF document about your company
  - The system will automatically extract company information using Mistral AI
  - Review and edit the extracted information if needed
- Save your profile to get better funding recommendations
- Edit your profile anytime by clicking the pencil icon

### Reports
- Click the "Reports" button in the navigation
- Generate professional PDF reports for funding applications
- **Generated Reports**: Automatically created from your company data and won grants
- **API Reports**: Create custom reports from LLM-generated content
- Download reports directly from the table
- Delete reports you no longer need

## API Endpoints

### Pages
- `GET /` - Landing page
- `GET /profile` - Company profile page
- `GET /reports` - Reports page

### Grants API
- `GET /api/grants` - Get all grants (includes won status)
- `POST /api/grants` - Create a new grant (won status defaults to false)
- `DELETE /api/grants/{grant_id}` - Delete a grant
- `PATCH /api/grants/{grant_id}/won` - Toggle won status of a grant

### Company API
- `GET /api/company` - Get company profile
- `POST /api/company` - Update company profile
- `POST /api/company/upload-pdf` - Upload and analyze company PDF
  - Body: `multipart/form-data` with `pdf_file` field
  - Returns: Extracted company information using Mistral AI

### Reports API
- `GET /api/reports` - Get all generated reports
- `POST /api/reports/generate` - Generate a new report
  - Body: `{"type": "generated|api", "content": "optional content"}`
- `GET /api/reports/{report_id}/download` - Download a report PDF
- `DELETE /api/reports/{report_id}` - Delete a report

## Environment Variables

### Required for PDF Analysis
- `MISTRAL_API_KEY`: Your Mistral AI API key for PDF content analysis
  - Get your API key from: https://console.mistral.ai/
  - Required for the PDF upload and analysis feature

### Optional
- `PORT`: Application port (defaults to 8000)

## Dependencies

- **FastAPI**: Web framework
- **PyMuPDF**: PDF text extraction
- **Requests**: HTTP client for Mistral AI API
- **ReportLab**: PDF report generation
- **Python-dotenv**: Environment variable management
- **Uvicorn**: ASGI server

