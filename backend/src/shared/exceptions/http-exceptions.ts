import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';


export function httpBadRequest(message?: string) {
  throw new BadRequestException(message);
}


export function httpUnAuthorized(message?: string) {
  throw new UnauthorizedException(message);
}

export function httpForbidden(message?: string) {
  throw new ForbiddenException(message);
}


export function httpNotFound(message?: string) {
  throw new NotFoundException(message);
}

export function httpConflict(message?: string) {
  throw new ConflictException(message);
}


export function httpInternalServerErrorException(message?: string) {
  throw new InternalServerErrorException(message);
}
