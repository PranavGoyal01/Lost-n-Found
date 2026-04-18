export interface User {
  id: string;
  name: string;
  profile_picture: string;
  phone_number: string;
  age: number;
  likes: string;
  dislikes: string;
}

export interface Moment {
  id: string;
  user_id: string;
  event_time: string;
  description: string;
  location: any;
  status?: string; 
}

export interface Match {
  id: string;
  other_user_name: string;
  other_user_phone: string;
  my_moment_description: string;
  their_moment_description: string;
  chat_id: string;
}