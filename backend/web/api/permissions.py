from rest_framework import permissions

class IsEngineerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        # 允许所有人（包括匿名）读取
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # 只有登录且角色为 ADMIN 或 ENGINEER 的人可以修改/删除
        return (
            request.user.is_authenticated and 
            request.user.role in ['ADMIN', 'ENGINEER']
        )
