import type { HttpClient } from '../http';

export abstract class BaseResource {
  constructor(protected readonly http: HttpClient) {}
}
