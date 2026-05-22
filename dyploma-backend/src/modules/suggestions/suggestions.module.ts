import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { SuggestionsService } from './suggestions.service';
import { SuggestionsController } from './suggestions.controller';
import { ThreatZonesModule } from '../threat-zones/threat-zones.module';

@Module({
    imports: [TypeOrmModule.forFeature([User]), ThreatZonesModule],
    controllers: [SuggestionsController],
    providers: [SuggestionsService],
})
export class SuggestionsModule { }