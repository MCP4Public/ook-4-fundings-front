# Look 4 Fundings

A modern web application for companies to discover, manage, and track funding opportunities. Built with FastAPI and modern frontend technologies.

## Features

- **Grant Management**: Add, view, and delete funding opportunities
- **Expandable Cards**: Click to expand grant cards for detailed information
- **Company Profile**: Manage your company information for better recommendations
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Instant updates when adding or removing grants

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

### Production Deployment

The application is automatically deployed to GitHub Pages when you push to the main branch.

**Live Demo:** [https://YOUR_ORG.github.io/look-4-fundings-front](https://YOUR_ORG.github.io/look-4-fundings-front)

## Usage

### Landing Page
- View all your saved funding opportunities
- Click the "Add New Grant" button to add a new funding opportunity
- Click on grant cards to expand and see full details
- Use the delete button (trash icon) to remove grants

### Company Profile
- Click the "Profile" button in the navigation
- Fill in your company information (name, website, scope)
- Save your profile to get better funding recommendations

## API Endpoints

- `GET /` - Landing page
- `GET /profile` - Company profile page
- `GET /api/grants` - Get all grants
- `POST /api/grants` - Create a new grant
- `DELETE /api/grants/{grant_id}` - Delete a grant
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

## Future Enhancements

- Database integration for persistent storage
- User authentication and multiple companies
- Advanced filtering and search capabilities
- Email notifications for deadlines
- Integration with funding APIs
- Analytics and reporting features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
