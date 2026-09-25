from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field(default="RecoverX", validation_alias=AliasChoices("app_name", "APP_NAME"))
    mongo_uri: str = Field(default="mongodb://localhost:27017", validation_alias=AliasChoices("mongo_uri", "MONGO_URI", "MONGODB_URI"))
    mongo_db: str = Field(default="recoverx", validation_alias=AliasChoices("mongo_db", "MONGO_DB"))
    use_remote_mongo: bool = Field(default=False, validation_alias=AliasChoices("use_remote_mongo", "USE_REMOTE_MONGO"))
    gemini_api_key: str = Field(default="", validation_alias=AliasChoices("gemini_api_key", "GEMINI_API_KEY"))
    gemini_model: str = Field(default="gemini-2.5-flash", validation_alias=AliasChoices("gemini_model", "GEMINI_MODEL"))
    jwt_secret: str = Field(default="change-me-in-production", validation_alias=AliasChoices("jwt_secret", "JWT_SECRET"))
    jwt_algorithm: str = Field(default="HS256", validation_alias=AliasChoices("jwt_algorithm", "JWT_ALGORITHM"))
    access_token_expire_minutes: int = Field(default=15, validation_alias=AliasChoices("access_token_expire_minutes", "ACCESS_TOKEN_EXPIRE_MINUTES"))
    refresh_token_expire_days: int = Field(default=7, validation_alias=AliasChoices("refresh_token_expire_days", "REFRESH_TOKEN_EXPIRE_DAYS"))

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)


settings = Settings()
