# Look 4 Fundings

A modern web application for companies to discover, manage, and track funding opportunities. Built with FastAPI and modern frontend technologies.

## Features

- **Grant Management**: Add, view, and delete funding opportunities
- **Won Status Tracking**: Mark grants as won or not won with visual indicators
- **Expandable Cards**: Click to expand grant cards for detailed information
- **Company Profile**: Manage your company information for better recommendations
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

## API Endpoints

- `GET /` - Landing page
- `GET /profile` - Company profile page
- `GET /api/grants` - Get all grants (includes won status)
- `POST /api/grants` - Create a new grant (won status defaults to false)
- `DELETE /api/grants/{grant_id}` - Delete a grant
- `PATCH /api/grants/{grant_id}/won` - Toggle won status of a grant
- `GET /api/company` - Get company profile
- `POST /api/company` - Update company profile

## Project Structure

```
look-4-fundings-front/
├── main.py              # FastAPI application
├── type.py              # Pydantic models
├── templates/           # HTML templates
│   ├── index.html       # Landing page
│   └── profile.html     # Company profile page
├── static/              # Static assets
│   ├── css/
│   │   └── style.css    # Custom styles
│   └── js/
│       ├── app.js       # Main application logic
│       └── profile.js   # Profile page logic
├── pyproject.toml       # Project configuration
└── README.md           # This file
```

## Data Models

### PublicFunding
- `title` (str): Title of the funding opportunity
- `url` (str): Direct link to the funding page
- `summary` (str): Summary/description of the funding
- `deadline` (date): Application deadline
- `status` (str): Current status (Open, Closed, Upcoming)
- `budget` (str): Budget information with currency
- `company_affinity` (float): Company affinity score (0-100)
- `won` (bool): Whether the grant was won or not (default: False)

### MyCompany
- `name` (str): Name of the company
- `url` (str): Direct link to the company's website
- `scope` (str): Description of the company's scope and activities

## Future Enhancements

- Database integration for persistent storage
- User authentication and multiple companies
- Advanced filtering and search capabilities
- Email notifications for deadlines
- Integration with funding APIs
- Analytics and reporting features
- Grant success rate tracking and analytics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
