import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  HealthQuestion,
  HealthQuestionDto,
  healthQuestionsInitialState,
} from '@core/models/insurance/health-question.model';
import { BehaviorSubject, Observable, shareReplay } from 'rxjs';

const BASE_URL: string = 'INSURANCE_API/';
const HEALTH_QUESTION_URL: string = BASE_URL + 'HealthQuestion/';

@Injectable({ providedIn: 'root' })
export class HealthQuestionService {
  private httpClient = inject(HttpClient);

  private _healthQuestions: BehaviorSubject<HealthQuestionDto[]> = new BehaviorSubject(healthQuestionsInitialState());
  public healthQuestions$ = this._healthQuestions.asObservable();

  public get healthQuestionsValue(): HealthQuestionDto[] {
    return this._healthQuestions.value;
  }

  set healthQuestions(healthQuestionValue: HealthQuestionDto[]) {
    this._healthQuestions.next(healthQuestionValue);
  }

  destroySession(): void {
    this._healthQuestions.next(healthQuestionsInitialState());
  }

  public updateHealthQuestion(healthQuestion: HealthQuestion): Observable<any> {
    return this.httpClient.put<any>(HEALTH_QUESTION_URL, { healthQuestionDto: healthQuestion });
  }

  public getHealthQuestionsByApplicationIdentifier(applicationIdentifier: string): Observable<any> {
    return this.httpClient.get<any>(`${HEALTH_QUESTION_URL}${applicationIdentifier}`).pipe(shareReplay());
  }
}
