from django.contrib import admin
from .models import Forum, Discussion, Post


class PostInline(admin.TabularInline):
    model = Post
    extra = 0
    readonly_fields = ("created_at",)
    fields = ("body", "author_user", "author_student", "likes_count", "created_at")


@admin.register(Forum)
class ForumAdmin(admin.ModelAdmin):
    list_display = ("name", "course", "group", "created_at")
    search_fields = ("name",)


@admin.register(Discussion)
class DiscussionAdmin(admin.ModelAdmin):
    list_display = ("title", "forum", "created_at")
    list_filter = ("forum", "is_pinned")
    search_fields = ("title",)
    inlines = [PostInline]


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("short_body", "discussion", "author_name", "created_at")
    list_filter = ("discussion__forum", "created_at")
    search_fields = ("body",)

    def short_body(self, obj):
        return obj.body[:50]
