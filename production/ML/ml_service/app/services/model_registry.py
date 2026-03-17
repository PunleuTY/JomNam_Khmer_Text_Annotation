"""Service layer for model management."""

from app.models import BaseModel


class ModelRegistry:
    """Registry for managing multiple ML models."""

    def __init__(self):
        """Initialize the model registry."""
        self._models: dict[str, BaseModel] = {}

    def register(self, name: str, model: BaseModel) -> None:
        """
        Register a model in the registry.

        Args:
            name: Unique identifier for the model.
            model: Model instance to register.
        """
        self._models[name] = model

    def get(self, name: str) -> BaseModel | None:
        """
        Get a model by name.

        Args:
            name: Model identifier.

        Returns:
            Model instance or None if not found.
        """
        return self._models.get(name)

    def list_models(self) -> list[str]:
        """
        List all registered model names.

        Returns:
            List of model names.
        """
        return list(self._models.keys())

    def load_all(self) -> None:
        """Load all registered models into memory."""
        for name, model in self._models.items():
            if not model.is_loaded:
                model.load()

    def unload_all(self) -> None:
        """Unload all registered models from memory."""
        for model in self._models.values():
            if model.is_loaded:
                model.unload()
