# Documentation

Start from what you need to do:

| I want to...                                       | Read                                                   |
| -------------------------------------------------- | ------------------------------------------------------ |
| Understand the problem and what the system must do | [product/requirements.md](product/requirements.md)     |
| Know what each role can do                         | [product/business-rules.md](product/business-rules.md) |
| Get the big picture of the architecture            | [architecture/overview.md](architecture/overview.md)   |
| Create or change something in the API              | [architecture/backend.md](architecture/backend.md)     |
| Create or change a screen                          | [architecture/frontend.md](architecture/frontend.md)   |
| Change a table or create a migration               | [architecture/database.md](architecture/database.md)   |
| Call the API                                       | [api.md](api.md)                                       |
| Understand the reason behind a choice              | [decisions/](decisions/README.md)                      |
| Work with AI agents in this project                | [agents.md](agents.md)                                 |

The code rules are in [AGENTS.md](../AGENTS.md) and the Git and GitHub workflow in [CONTRIBUTING.md](../CONTRIBUTING.md).

## Keeping this folder healthy

- Each document covers one subject. Before creating a new file, check whether the subject already has a home.
- The official value of versions, environment variables and routes lives in the code (`package.json`, `.env.example`, route files). The documentation explains and points there, without repeating numbers that change often.
- A decision someone may question later becomes a record in [decisions/](decisions/README.md).
