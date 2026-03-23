import logging

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - [%(funcName)s]: %(levelname)s - %(message)s",
)


class Logger:

    @staticmethod
    def getInstance(component_name: str) -> logging.Logger:
        """
        Logger instance to use for each comopnent

        Args:
            component_name (str): component identity name to be shown in logs

        Returns:
            _type_: logging.Logger
        """
        return logging.getLogger(component_name)
