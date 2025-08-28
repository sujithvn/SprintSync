#!/bin/bash
# SprintSync Docker Development Commands

echo "🚀 SprintSync Docker Helper"
echo "=========================="

case "$1" in
  "build")
    echo "Building Docker images..."
    docker-compose build
    ;;
  "up")
    echo "Starting SprintSync services..."
    docker-compose up -d
    echo "✅ Services started!"
    echo "📊 Backend API: http://localhost:3000"
    echo "📚 Swagger Docs: http://localhost:3000/api-docs"
    echo "🗄️  Database: localhost:5432"
    ;;
  "down")
    echo "Stopping SprintSync services..."
    docker-compose down
    ;;
  "logs")
    echo "Showing logs..."
    docker-compose logs -f
    ;;
  "reset")
    echo "Resetting all data (WARNING: This will delete all data!)"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      docker-compose down -v
      docker-compose up -d
    fi
    ;;
  *)
    echo "Usage: $0 {build|up|down|logs|reset}"
    echo ""
    echo "Commands:"
    echo "  build  - Build Docker images"
    echo "  up     - Start all services"
    echo "  down   - Stop all services"
    echo "  logs   - Show service logs"
    echo "  reset  - Reset all data (destructive)"
    ;;
esac
