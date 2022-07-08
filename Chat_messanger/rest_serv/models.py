from django.db import models
from django.contrib.auth.models import User
from easy_thumbnails.fields import ThumbnailerImageField


class Room(models.Model):
    name = models.CharField(max_length=256, unique=True)


class UserProfile(models.Model):
    name = models.CharField(max_length=256, unique=True)
    avatar = ThumbnailerImageField(resize_source={'size': (300, 300), 'crop': 'smart'}, upload_to='djangochatserver', default='djangochatserver/default.jpg')
    avatar_small = ThumbnailerImageField(resize_source={'size': (30, 30), 'crop': 'smart'}, upload_to='djangochatserver', default='djangochatserver/default_small.jpg')
    room = models.OneToOneField(Room, on_delete=models.SET_NULL, null=True)
    online = models.BooleanField(default=False)

    def user_list(self):
        users = UserProfile.objects.filter().order_by('name')
        return list(users)


class Message(models.Model):
    author = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    text = models.CharField(max_length=255)

