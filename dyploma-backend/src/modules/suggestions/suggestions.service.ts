import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ExperienceLevel,
  User,
  UserStatus,
} from '../users/entities/user.entity';
import { SuggestionRequestDto } from './dto/suggestion-request.dto';
import { SuggestionResponseDto } from './dto/suggestion-response.dto';
import { isPointInRegion } from './regions.helper';
import { ThreatZonesService } from '../threat-zones/threat-zones.service';

/** Ray-casting point-in-polygon: polygon is [lng, lat][] */
function pointInPolygon(lng: number, lat: number, polygon: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

@Injectable()
export class SuggestionsService {
  private readonly logger = new Logger(SuggestionsService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly threatZonesService: ThreatZonesService,
  ) {}

  async findSuggestions(
    params: SuggestionRequestDto,
  ): Promise<SuggestionResponseDto> {
    this.logger.log(
      `Finding suggestions for mission in ${params.region} with skills: ${params.requiredSkills.join(', ')}`,
    );

    // 1. FILTER: available volunteers with ALL required skills
    const qualifiedVolunteers = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.status = :status', { status: UserStatus.AVAILABLE })
      .andWhere('user.skills @> :requiredSkills', {
        requiredSkills: params.requiredSkills,
      })
      .getMany();

    this.logger.log(`Found ${qualifiedVolunteers.length} qualified and available volunteers.`);

    // Load threat zones once for all volunteers
    const threatZones = await this.threatZonesService.getThreatZones();

    // 2. SCORE
    const scoredVolunteers = qualifiedVolunteers.map((volunteer) => {
      let score = 50; // Base score
      const reasons: string[] = ['Qualified & Available'];

      // Geospatial: bonus if volunteer is based in the mission region
      if (isPointInRegion(volunteer.homeBase, params.region)) {
        score += 30;
        reasons.push('Based in region');
      }

      // Threat zone penalty: -20 if volunteer homeBase is inside any threat zone
      if (volunteer.homeBase) {
        const { lat, lng } = volunteer.homeBase;
        for (const zone of threatZones) {
          const polygon = zone.geometry?.coordinates?.[0];
          if (polygon && pointInPolygon(lng, lat, polygon)) {
            score -= 20;
            reasons.push(`In danger zone (${zone.name})`);
            break; // one penalty is enough
          }
        }
      }

      // Experience bonus
      if (params.difficulty === 'hazardous') {
        if (volunteer.experienceLevel === ExperienceLevel.EXPERT) {
          score += 20;
          reasons.push('Expert level');
        } else if (volunteer.experienceLevel === ExperienceLevel.SENIOR) {
          score += 10;
          reasons.push('Senior level');
        }
      } else {
        if (
          volunteer.experienceLevel === ExperienceLevel.EXPERT ||
          volunteer.experienceLevel === ExperienceLevel.SENIOR
        ) {
          score += 5;
          reasons.push('Experienced');
        }
      }

      return {
        id: volunteer.id,
        name: volunteer.name,
        experienceLevel: volunteer.experienceLevel,
        homeBase: volunteer.homeBase,
        score,
        reasons,
      };
    });

    // 3. SORT & SLICE: top 5 by score
    const topVolunteers = scoredVolunteers
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    this.logger.log(`Returning top ${topVolunteers.length} volunteer suggestions.`);

    return {
      volunteers: topVolunteers,
      resources: [],
    };
  }
}
