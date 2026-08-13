from pydantic import BaseModel


class PermissionSetRequest(BaseModel):
    role: str
    permission: str
    enabled: bool
