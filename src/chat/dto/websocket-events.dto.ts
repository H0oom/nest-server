export class AuthenticateDto {
  token: string;
}

export class JoinRoomDto {
  room_id: number;
}

export class LeaveRoomDto {
  room_id: number;
}

export class SendMessageDto {
  room_id: number;
  message: string;
}

export class AuthenticatedResponseDto {
  message: string;
  user: {
    user_id: string;
    name: string;
    email: string;
    token: string;
  };
}

export class AuthErrorResponseDto {
  message: string;
}

export class RoomJoinedResponseDto {
  room_id: string;
  message: string;
}

export class RoomLeftResponseDto {
  room_id: string;
  message: string;
}

export class UserJoinedResponseDto {
  user_id: string;
  user_name: string;
}

export class UserLeftResponseDto {
  user_id: string;
  user_name: string;
}

export class NewMessageResponseDto {
  id: string;
  user_id: string;
  user_name: string;
  message: string;
  created_at: string;
}

export class ErrorResponseDto {
  message: string;
}
