// src/services/api/comments.js

import axios from "axios";
import { postServiceBaseUrl } from "../../config/apiBase";

const authAxios = axios.create({ withCredentials: true });
authAxios.interceptors.request.use((config) => {
  const b = postServiceBaseUrl();
  if (b) config.baseURL = b;
  return config;
});

export const fetchCommentsByPostId = async (postId) => {
  try {
    const base = postServiceBaseUrl();
    const response = await axios.get(`${base}/api/posts/${postId}/comments`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching comments for post ${postId}:`, error);
    throw error;
  }
};

export const createComment = async (postId, commentRequestData) => {
  try {
    const response = await authAxios.post(`/api/posts/${postId}/comments`, commentRequestData);
    return response.data;
  } catch (error) {
    console.error("Error creating comment:", error);
    throw error;
  }
};

export const updateComment = async (commentId, commentRequestData) => {
  try {
    const response = await authAxios.put(`/api/posts/comments/${commentId}`, commentRequestData);
    return response.data;
  } catch (error) {
    console.error(`Error updating comment ${commentId}:`, error);
    throw error;
  }
};

export const deleteComment = async (commentId) => {
  try {
    const response = await authAxios.delete(`/api/posts/comments/${commentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting comment ${commentId}:`, error);
    throw error;
  }
};
