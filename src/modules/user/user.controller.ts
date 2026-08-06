import { ApiTags } from '@nestjs/swagger';
import { Controller } from '@nestjs/common';

import { ApiErrors } from '../../common/errors/api-errors.decorator';

import { UserService } from './user.service';

@ApiTags('User')
@ApiErrors('INTERNAL_ERROR')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
}
