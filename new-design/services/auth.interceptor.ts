import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs/Observable';

import { DataService } from "./data.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private dataService:DataService){}
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    req = req.clone({
      setHeaders: {
        'Content-Type' : 'application/json; charset=utf-8',
        'Accept'       : 'application/json',
        'Authorization': `Bearer ${this.dataService.loggedInUser.refreshToken}`,
      },
    });

    debugger;
    return next.handle(req);
  }
}