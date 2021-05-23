# from rest_framework.permissions import BasePermission
#
#
# class IsSuperUser(BasePermission):
#
#     def has_permission(self, request, view):
#         return bool(request.user and request.user.is_superuser)

from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # использовать только безопасные методы, если не владелец
        if request.method in permissions.SAFE_METHODS:
            return True
        # если владелец - можно изменять данные
        return  obj.user == request.user


    