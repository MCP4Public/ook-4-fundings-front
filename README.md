# Look 4 Fundings

A modern web application for companies to discover, manage, and track funding opportunities. Built with FastAPI and modern frontend technologies.

## Features

- **Grant Management**: Add, view, and delete funding opportunities
- **Won Status Tracking**: Mark grants as won or not won with visual indicators
- **Expandable Cards**: Click to expand grant cards for detailed information
- **Company Profile**: Manage your company information for better recommendations
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

3. Run the application:
```bash
# Using uv
uv run python main.py

# Or directly
python main.py
```

4. Open your browser and navigate to `http://localhost:8000`

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
- Fill in your company information (name, website, scope)
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

### Reports API
- `GET /api/reports` - Get all generated reports
- `POST /api/reports/generate` - Generate a new report
  - Body: `{"type": "generated|api", "content": "optional content"}`
- `GET /api/reports/{report_id}/download` - Download a report PDF
- `DELETE /api/reports/{report_id}` - Delete a report

