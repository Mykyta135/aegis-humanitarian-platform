import { Coordinates } from '../../users/entities/user.entity';

export class SuggestionResponseDto {
  volunteers: {
    id: string;
    name: string;
    experienceLevel: string;
    homeBase: Coordinates;
    score: number;
    reasons: string[];
  }[];

  resources: any[];
}
