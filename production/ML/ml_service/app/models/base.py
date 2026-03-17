"""Abstract base class for all ML models."""

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any


class BaseModel(ABC):
    """Abstract base class defining the interface for all ML models."""

    def __init__(self, model_path: Path):
        """
        Initialize the model.

        Args:
            model_path: Path to the model file/weights.
        """
        self.model_path = model_path
        self._model: Any = None
        self._is_loaded: bool = False

    @property
    def is_loaded(self) -> bool:
        """Check if the model is loaded in memory."""
        return self._is_loaded

    @abstractmethod
    def load(self) -> None:
        """Load the model into memory."""
        pass

    @abstractmethod
    def predict(self, input_data: Any) -> Any:
        """
        Run inference on the input data.

        Args:
            input_data: The input data for inference.

        Returns:
            The prediction results.
        """
        pass

    @abstractmethod
    def unload(self) -> None:
        """Unload the model from memory."""
        pass
