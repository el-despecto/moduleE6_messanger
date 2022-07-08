from rest_framework import serializers
from .models import UserProfile, Room
from django.contrib.auth.models import User


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ('id', 'name')


# class UserSerializer(serializers.HyperlinkedModelSerializer):
#     class Meta:
#         model = User
#         fields = ('id', 'username')


class UserProfileSerializer(serializers.HyperlinkedModelSerializer):
    # username = serializers.CharField(source="user.username")
    # user_id = serializers.CharField(source="user.id")

    class Meta:
        model = UserProfile
        fields = ('id', 'name', 'avatar', 'avatar_small', 'room')

    # def create(self, validated_data):
    #     print(validated_data['username'])
    #     # user = User(username=validated_data['username'])
    #     # user.set_password(validated_data['password'])
    #     # user.save()
    #     return validated_data
