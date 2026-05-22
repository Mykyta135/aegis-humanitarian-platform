import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuggestionRequestDto } from './dto/suggestion-request.dto';
import { SuggestionsService } from './suggestions.service';

@ApiBearerAuth()
@ApiTags('Suggestions')
@Controller('suggestions')
@UseGuards(JwtAuthGuard)
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Post('tasks')
  findTaskSuggestions(@Body() suggestionRequestDto: SuggestionRequestDto) {
    return this.suggestionsService.findSuggestions(suggestionRequestDto);
  }
}
