import { apiRequest } from '../api';
import type {
  Callback,
  CreateCallbackRequest,
  CreateFeedbackRequest,
} from '../types/support';

/** POST /callbacks */
export const requestCallback = (body: CreateCallbackRequest) =>
  apiRequest<Callback>('/callbacks', { method: 'POST', body });

/** POST /feedback */
export const submitFeedback = (body: CreateFeedbackRequest) =>
  apiRequest<{ _id: string }>('/feedback', {
    method: 'POST',
    body: { source: 'customer_app', ...body },
  });
