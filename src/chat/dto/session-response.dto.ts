export class ParticipantDto {
  id: number;
  name: string;
}

export class SessionResponseDto {
  room_id: number;
  participants: ParticipantDto[];
}
