import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  input,
  Input,
  OnInit,
  output,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { MatRadioChange, MatRadioModule } from '@angular/material/radio';
import { Store } from '@ngrx/store';
import { isEqual } from 'lodash';
import { Observable, take } from 'rxjs';
import { ApplicantCoverage } from '@core/models/insurance/coverage.model';
import { HealthQuestionDto, HealthQuestionsSpDto } from '@core/models/insurance/health-question.model';
import {
  InsuranceTypeHealthQuestionRequest,
  InsuranceTypeApplicantResponse,
  InsuranceTypeHealthQuestionConfigurationResponse,
  QuoteInsuranceTypeResponse,
} from '@core/models/insurance/quote-insurance-type.model';
import { initialMessageState, MessageType } from '@core/models/insurance/stepper-message.model';
import { MultiApplicantService } from '@core/services/insurance/multi-applicant.service';
import { SharedStepService } from '@core/services/insurance/shared-step.service';
import { StepperMessageService } from '@core/services/insurance/stepper-message.service';
import { CI_TITLE_QUESTIONS, DIS_TITLE_QUESTIONS, INSURANCE_TYPE } from '@core/utils/enums/insurance-enums';
import { AppState } from '@store';
import { quoteInsuranceTypeResponseSelector } from '@store/pages/new-policy/insurance-application/selectors/insurance-application.selectors';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NoHealthQuestionsComponent } from '../no-health-questions/no-health-questions.component';
import { AsyncPipe } from '@angular/common';
import { QuestionComponent } from './question/question.component';

const preDefineQuestionsArrayMP: string[] = ['2', '4', '5'];
const preDefineQuestionsArraySP: string[] = ['2', '4', '6'];

interface answers {
  previous: boolean;
  actual: boolean | null;
}
interface questionAnswer {
  questionId: string;
  autoWaive: boolean;
  answers: answers;
}
export interface AutoWaiveQuestions {
  applicantSequence: number;
  previouslyAnswered: boolean;
  questionsAnswers: questionAnswer[];
}
@Component({
  selector: 'app-questions',
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.scss'],
  standalone: true,
  imports: [
    NoHealthQuestionsComponent,
    QuestionComponent,
    FormsModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatRadioModule,
    MatDividerModule,
    AsyncPipe,
  ],
})
export class QuestionsComponent implements OnInit {
  @ViewChildren(QuestionComponent) questionForm!: QueryList<QuestionComponent>;

  applicantSequence = input.required<number>();
  index = input<number>(0);
  questionsAnswersInputList = input.required<AutoWaiveQuestions[]>();

  isFormValidEvent = output<boolean>();
  setReadOnly = output<boolean>();

  private multiApplicantService = inject(MultiApplicantService);
  private stepperMessage = inject(StepperMessageService);
  private stepService = inject(SharedStepService);
  private cd = inject(ChangeDetectorRef);
  private store = inject(Store<AppState>);

  public questionsAnswersList: AutoWaiveQuestions[] = [];
  public isReadOnly: boolean = false;
  public quoteResponse!: QuoteInsuranceTypeResponse;
  public quoteInsuranceTypeResponseData$: Observable<QuoteInsuranceTypeResponse> = new Observable();
  public applicant!: InsuranceTypeApplicantResponse;
  public healthQuestions: HealthQuestionDto[] = [];
  public healthSPQuestions: HealthQuestionsSpDto[] = [];
  public questionsForm: FormGroup = new FormGroup({});
  public selectedInsuranceType: string = '';
  public answerWasNull: boolean = false;
  public url: string = window.location.href;

  constructor() {
    this.quoteInsuranceTypeResponseData$ = this.store.select(quoteInsuranceTypeResponseSelector);
  }
  ngAfterViewInit(): void {
    this.cd.detectChanges();
  }

  ngOnInit() {
    this.questionsAnswersList = this.questionsAnswersInputList();
    this.getQuotesFromSession();

    this.questionsForm.statusChanges.subscribe((status) => {
      if (
        status === 'INVALID' ||
        this.questionsForm.get(`disclaimer-${this.applicantSequence()}`)?.value === null ||
        this.questionsForm.get(`disclaimer-${this.applicantSequence()}`)?.value === false
      ) {
        this.isFormValidEvent.emit(false);
      } else if (status === 'VALID') {
        this.isFormValidEvent.emit(true);
      }
    });

    this.getApplicationFromSession();

    this.checkingPreviousQuestion();
  }

  private checkingPreviousQuestion() {
    this.stepService.currentStateInfo.subscribe((step) => {
      if (step.currentStep === 4) {
        this.questionsForm.get(`disclaimer-${this.applicantSequence()}`)?.setValue(true);
      }

      if (step.currentStep === 4 && step.readOnlyBehavior) {
        this.questionsForm.disable();
      }
    });
  }

  private addDisclaimerControl() {
    if (this.healthQuestions.length > 0 || this.healthSPQuestions.length > 0) {
      this.questionsForm.addControl(
        `disclaimer-${this.applicantSequence()}`,
        new FormControl(null, Validators.required)
      );
      if (this.index() === 0) {
        this.isFormValidEvent.emit(false);
      }
    }
  }

  // private checkDisclaimer() {
  //   let disclaimerCheck: boolean = false;
  //   this.quoteResponse.quotes[0].applicants.filter(({ applicantType }) => (applicantType === this.applicantSequence()))
  //     .forEach((applicant) => {
  //       applicant.applicantCoverages.forEach((coverage) => {
  //         if (coverage.healthQuestionAnswers.length > 0) {
  //           disclaimerCheck = true;
  //         }
  //       })
  //     });
  //
  //   if (disclaimerCheck) {
  //     this.questionsForm.get(`disclaimer-${this.applicantType}`)?.setValue(true);
  //     this.questionsForm.get(`disclaimer-${this.applicantType}`)?.markAsTouched();
  //   }
  // }

  private getApplicationFromSession = () => {
    this.isReadOnly = this.multiApplicantService.setReadOnly(this.questionsForm);
    this.setReadOnly.emit(this.isReadOnly);
  };

  private needToAddQuestion(coverage: ApplicantCoverage): boolean {
    let flag = false;
    const answers: string[] = coverage.healthQuestionAnswers
      .map((answer) => answer.healthQuestionIdentifier)
      .sort((a, b) => parseInt(a) - parseInt(b));
    const questions: string[] = coverage.healthQuestionConfigurations.map(
      (question) => question.healthQuestionIdentifier
    );
    if (!isEqual(answers, questions)) {
      flag = true;
    }

    return flag;
  }

  private removePreviousControls() {
    Object.keys(this.questionsForm.controls).forEach((controlName) => {
      this.questionsForm.removeControl(controlName);
    });
  }

  private getQuotesFromSession() {
    this.quoteInsuranceTypeResponseData$.subscribe((quoteResponse: QuoteInsuranceTypeResponse) => {
      this.quoteResponse = quoteResponse;
      this.selectedInsuranceType = quoteResponse.insuranceType;
      if (quoteResponse.insuranceType === INSURANCE_TYPE.SINGLE_PREMIUM) {
        if (this.healthQuestions.length > 0) {
          this.healthQuestions = [];
          this.questionsAnswersList = [];
          this.removePreviousControls();
          this.answerWasNull = false;
        }

        this.populateSinglePremiumHealthQuestions(quoteResponse);
        this.addDisclaimerControl();
      } else {
        if (this.healthSPQuestions.length > 0) {
          this.healthSPQuestions = [];
          this.questionsAnswersList = [];
          this.removePreviousControls();
          this.answerWasNull = false;
        }
        this.populateGeneralHealthQuestions(quoteResponse);
        this.addDisclaimerControl();
      }
    });
  }

  private initializeHealthSpDto = (dtoHealthQuestions: HealthQuestionsSpDto[], applicantSequence: number) => {
    if (dtoHealthQuestions.filter((dtoQuestion) => dtoQuestion.index === this.index()).length === 0) {
      dtoHealthQuestions.push({
        title: DIS_TITLE_QUESTIONS,
        index: this.index(),
        // applicantType: applicantType,
        applicantSequence: applicantSequence,
        healthQuestionsDto: [],
      });

      dtoHealthQuestions.push({
        title: CI_TITLE_QUESTIONS,
        index: this.index(),
        // applicantType: applicantType,
        applicantSequence: applicantSequence,
        healthQuestionsDto: [],
      });
    }
  };

  private populateSinglePremiumHealthQuestions(quoteResponse: QuoteInsuranceTypeResponse) {
    const dtoHealthQuestions: HealthQuestionsSpDto[] = [];

    quoteResponse.applications.forEach((application) => {
      application.applicants
        ?.filter(({ applicantSequence }) => applicantSequence === this.applicantSequence())
        .forEach((applicant) => {
          applicant.applicantCoverages?.forEach((coverage: ApplicantCoverage) => {
            if (coverage.healthQuestionAnswers.length === 0 || this.needToAddQuestion(coverage)) {
              coverage.healthQuestionConfigurations?.forEach((healthQuestion) => {
                this.initializeHealthSpDto(
                  dtoHealthQuestions,
                  applicant.applicantSequence ? applicant.applicantSequence : 0
                );

                if (coverage.coverageType === 'LIFE' || coverage.coverageType === 'DIS') {
                  if (
                    dtoHealthQuestions[0].healthQuestionsDto.length === 0 ||
                    dtoHealthQuestions[0].healthQuestionsDto.filter(
                      (question) => question.questionIdentifier === healthQuestion.healthQuestionIdentifier
                    ).length === 0
                  ) {
                    this.addDtoQuestion(dtoHealthQuestions, 0, healthQuestion, coverage);
                  }
                } else {
                  if (
                    dtoHealthQuestions[1].healthQuestionsDto.length === 0 ||
                    dtoHealthQuestions[1].healthQuestionsDto.filter(
                      (question) => question.questionIdentifier === healthQuestion.healthQuestionIdentifier
                    ).length === 0
                  ) {
                    this.addDtoQuestion(dtoHealthQuestions, 1, healthQuestion, coverage);
                  }
                }
              });
            } else {
              coverage.healthQuestionAnswers?.forEach((healthQuestion) => {
                this.initializeHealthSpDto(
                  dtoHealthQuestions,
                  applicant.applicantSequence ? applicant.applicantSequence : 0
                );

                if (coverage.coverageType === 'LIFE' || coverage.coverageType === 'DIS') {
                  if (
                    dtoHealthQuestions[0].healthQuestionsDto.length === 0 ||
                    dtoHealthQuestions[0].healthQuestionsDto.filter(
                      (question) => question.questionIdentifier === healthQuestion.healthQuestionIdentifier
                    ).length === 0
                  ) {
                    this.addDtoQuestionAnswered(dtoHealthQuestions, 0, healthQuestion, coverage);
                  }
                } else {
                  if (
                    dtoHealthQuestions[1].healthQuestionsDto.length === 0 ||
                    dtoHealthQuestions[1].healthQuestionsDto.filter(
                      (question) => question.questionIdentifier === healthQuestion.healthQuestionIdentifier
                    ).length === 0
                  ) {
                    this.addDtoQuestionAnswered(dtoHealthQuestions, 1, healthQuestion, coverage);
                  }
                }
              });
            }
          });
        });
    });

    dtoHealthQuestions.forEach((healthQuestions, index) => {
      if (healthQuestions.healthQuestionsDto.length === 0) {
        dtoHealthQuestions.splice(index, 1);
      }
    });

    this.healthSPQuestions = dtoHealthQuestions;
  }

  public hasApplicantQuestions = (): boolean => {
    const result = this.getApplicantBySequence(
      this.applicantSequence() ? this.applicantSequence() : 0,
      this.quoteResponse
    ).applicantCoverages?.filter(
      (coverage) => coverage.healthQuestionConfigurations.length > 0 || coverage.healthQuestionAnswers.length > 0
    ).length;

    return result && result > 0 ? true : false;
  };

  private addDtoQuestionAnswered(
    dtoHealthQuestions: HealthQuestionsSpDto[],
    index: number,
    healthQuestion: InsuranceTypeHealthQuestionRequest,
    coverage: ApplicantCoverage
  ) {
    if (
      dtoHealthQuestions[index].healthQuestionsDto.length === 0 ||
      dtoHealthQuestions[index].healthQuestionsDto.filter(
        (question) => question.questionIdentifier === healthQuestion.healthQuestionIdentifier
      ).length === 0
    ) {
      const autoWaive = coverage.healthQuestionConfigurations.filter(
        (question) => question.healthQuestionIdentifier === healthQuestion.healthQuestionIdentifier
      )[0].autoWaive;
      const answer = healthQuestion.answer === 'true' ? true : false;

      let disabledControl = false;
      this.stepService.currentStateInfo.subscribe((step) => { 
        disabledControl = (step.currentStep === 4 && step.readOnlyBehavior) || (preDefineQuestionsArraySP.includes(healthQuestion.healthQuestionIdentifier) ? true : false); 
      });

      dtoHealthQuestions[index].healthQuestionsDto.push({
        applicantType: 'N/A',
        applicantSequence: this.applicantSequence() ? this.applicantSequence() : 0,
        questionIdentifier: healthQuestion.healthQuestionIdentifier,
        autoWaive: autoWaive,
        question: this.quoteResponse.healthQuestions.filter(
          (question) => question.healthQuestionIdentifier === healthQuestion.healthQuestionIdentifier
        )[0].question,
        answer: answer,
        disabled: disabledControl,
      });
    } else {
      console.log('4. Do Something here with the questions answered.');
    }
  }

  private addDtoQuestion(
    dtoHealthQuestions: HealthQuestionsSpDto[],
    index: number,
    healthQuestion: InsuranceTypeHealthQuestionConfigurationResponse,
    // coverage: InsuranceTypeApplicantCoverageResponse
    coverage: ApplicantCoverage
  ) {
    if (
      dtoHealthQuestions[index].healthQuestionsDto.length === 0 ||
      dtoHealthQuestions[index].healthQuestionsDto.filter(
        (question) => question.questionIdentifier === healthQuestion.healthQuestionIdentifier
      ).length === 0
    ) {
      let answerRequest = this.questionAnswerByIdentifier(
        healthQuestion.healthQuestionIdentifier,
        this.applicantSequence() ? this.applicantSequence() : 0,
        coverage.coverageType
      );

      let disabledControl = false;
      this.stepService.currentStateInfo.subscribe((step) => { 
        disabledControl = (step.currentStep === 4 && step.readOnlyBehavior) || (preDefineQuestionsArraySP.includes(healthQuestion.healthQuestionIdentifier) ? true : false); 
      });

      dtoHealthQuestions[index].healthQuestionsDto.push({
        applicantType: 'N/A',
        applicantSequence: this.applicantSequence() ? this.applicantSequence() : 0,
        questionIdentifier: healthQuestion.healthQuestionIdentifier,
        autoWaive: healthQuestion.autoWaive,
        question: this.quoteResponse.healthQuestions.filter(
          (question) => question.healthQuestionIdentifier === healthQuestion.healthQuestionIdentifier
        )[0].question,
        answer: answerRequest,
        disabled: disabledControl,
      });
    } else {
      console.log('1. Do Something here');
    }
  }

  private populateGeneralHealthQuestions(quoteResponse: QuoteInsuranceTypeResponse) {
    const dtoHealthQuestions: HealthQuestionDto[] = [];

    quoteResponse.applications.forEach((application) => {
      application.applicants
        ?.filter(({ applicantSequence }) => applicantSequence === this.applicantSequence())
        .forEach((applicant) => {
          applicant.applicantCoverages?.forEach((coverage) => {
            if (coverage.healthQuestionAnswers.length === 0 || this.needToAddQuestion(coverage)) {
              coverage.healthQuestionConfigurations.forEach((healthQuestion) => {
                if (
                  dtoHealthQuestions.length === 0 ||
                  dtoHealthQuestions.filter(
                    (question) => question.questionIdentifier === healthQuestion.healthQuestionIdentifier
                  ).length === 0
                ) {
                  let answerRequest = this.questionAnswerByIdentifier(
                    healthQuestion.healthQuestionIdentifier,
                    this.applicantSequence() ? this.applicantSequence() : 0,
                    coverage.coverageType
                    );

                  let disabledControl = false;
                  this.stepService.currentStateInfo.subscribe((step) => { 
                    disabledControl = (step.currentStep === 4 && step.readOnlyBehavior) || (preDefineQuestionsArrayMP.includes(healthQuestion.healthQuestionIdentifier) ? true : false); 
                  });

                  dtoHealthQuestions.push({
                    applicantType: 'N/A',
                    applicantSequence: this.applicantSequence() ? this.applicantSequence() : 0,
                    questionIdentifier: healthQuestion.healthQuestionIdentifier,
                    autoWaive: healthQuestion.autoWaive,
                    question: this.quoteResponse.healthQuestions.filter(
                      (question) => question.healthQuestionIdentifier === healthQuestion.healthQuestionIdentifier
                    )[0].question,
                    answer: answerRequest,
                    disabled: disabledControl,
                  });
                }

                if (
                  dtoHealthQuestions.filter(
                    (question) =>
                      question.questionIdentifier === healthQuestion.healthQuestionIdentifier &&
                      question.autoWaive === healthQuestion.autoWaive
                  ).length === 0
                ) {
                  const dtoQuestion = dtoHealthQuestions.filter(
                    (dtoQuestion) => dtoQuestion.questionIdentifier === healthQuestion.healthQuestionIdentifier
                  )[0];
                  dtoQuestion.autoWaive = healthQuestion.autoWaive;
                }
              });
            } else {
              coverage.healthQuestionAnswers.forEach((healthQuestion) => {
                if (
                  dtoHealthQuestions.length === 0 ||
                  dtoHealthQuestions.filter(
                    (question) => question.questionIdentifier === healthQuestion.healthQuestionIdentifier
                  ).length === 0
                ) {
                  let answerRequest = this.questionAnswerByIdentifier(
                    healthQuestion.healthQuestionIdentifier,
                    this.applicantSequence() ? this.applicantSequence() : 0,
                    coverage.coverageType
                  );
                    const noQuestionAnswered = healthQuestion.answer === 'true' ? true : false;

                  let disabledControl = false;
                  this.stepService.currentStateInfo.subscribe((step) => { 
                    disabledControl = (step.currentStep === 4 && step.readOnlyBehavior) || (preDefineQuestionsArrayMP.includes(healthQuestion.healthQuestionIdentifier) ? true : false); 
                  });
                  
                  const hasAutoWaive = this.getAutoWaiveByQuestion(
                    healthQuestion.healthQuestionIdentifier,
                    applicant.applicantCoverages
                  );

                  dtoHealthQuestions.push({
                    applicantType: 'N/A',
                    applicantSequence: this.applicantSequence() ? this.applicantSequence() : 0,
                    questionIdentifier: healthQuestion.healthQuestionIdentifier,
                    autoWaive: hasAutoWaive, //false, // healthQuestion.autoWaive,
                    question: this.quoteResponse.healthQuestions.filter(
                      (question) => question.healthQuestionIdentifier === healthQuestion.healthQuestionIdentifier
                    )[0].question,
                    answer: answerRequest !== null ? answerRequest : noQuestionAnswered,
                    disabled: disabledControl,
                  });
                }
              });
            }
          });
        });
    });

    this.healthQuestions = dtoHealthQuestions.sort(
      (a, b) => parseInt(a.questionIdentifier) - parseInt(b.questionIdentifier)
    );
  }

  private getAutoWaiveByQuestion(questionIdentifier: string, coverages: ApplicantCoverage[] | undefined): boolean {
    let flag: boolean = false;
    coverages?.map((coverage) =>
      coverage.healthQuestionConfigurations
        .filter((questionConfig) => questionConfig.healthQuestionIdentifier === questionIdentifier)
        .forEach((configQuestion) => {
          if (configQuestion.autoWaive) {
            flag = true;
          }
        })
    );

    return flag;
  }

  private getApplicantBySequence(applicantSequence: number, quoteResponse: QuoteInsuranceTypeResponse) {
    const result = quoteResponse.applications.map(
      (application) =>
        application.applicants.filter((applicant) => applicant.applicantSequence === applicantSequence)[0]
    );

    return result[0] ? result[0] : result[1] ? result[1] : result[2] ? result[2] : result[3];
  }

  private questionAnswerByIdentifier(questionIdentifier: string, applicantSequence: number, coverageType: string) {
    let flag = null;

    this.quoteInsuranceTypeResponseData$.pipe(take(1)).subscribe((quoteResponse: QuoteInsuranceTypeResponse) => {
      const applicant = this.getApplicantBySequence(applicantSequence, quoteResponse);

      const questionAnswer = applicant?.applicantCoverages
        ?.filter((coverage) => coverage.coverageType === coverageType)[0]
        ?.healthQuestionAnswers.filter((answer) => answer.healthQuestionIdentifier === questionIdentifier)[0]?.answer;

      if (applicant !== undefined) {
        switch (parseInt(questionIdentifier)) {
          case 2:
            if (applicant.isSmoker) {
              flag = true;
            } else {
              flag = false;
            }
            break;
          case 6:
            if (quoteResponse.insuranceType == INSURANCE_TYPE.SINGLE_PREMIUM) {
              if (applicant.workHours == 0) {
                flag = true;
              } else {
                flag = false;
              }
            }
            break;
          case 4:
            if (
              quoteResponse.insuranceType === 'MO' ||
              quoteResponse.insuranceType === 'OB' ||
              quoteResponse.insuranceType === 'LC'
            ) {
              if (applicant.workHours == 0) {
                flag = true;
              } else {
                flag = false;
              }
            }
            break;
          case 5:
            if (applicant.selfEmployed) {
              flag = true;
            } else {
              flag = false;
            }
            break;
          default:
            if (questionAnswer !== undefined && questionAnswer !== '') {
              flag = questionAnswer;
            }
            break;
        }
      }
    });

    return flag;
  }

  public changeQuestion(question: HealthQuestionDto) {
    let answer!: questionAnswer;
    const previouslyAnswered =
      this.questionsAnswersList.filter((answer) => answer.previouslyAnswered === true).length > 0;
    if (previouslyAnswered) {
      this.questionsAnswersList
        .filter((answer) => answer.applicantSequence === this.applicantSequence())[0]
        .questionsAnswers.filter((qAnswer) => qAnswer.questionId === question.questionIdentifier)
        .forEach((answerQu) => {
          if (answerQu.answers.actual === null) {
            this.answerWasNull = true;
          }
          // answerQu.answers.actual = event.value === 'true' ? true : false;
          answerQu.answers.actual = question.answer;
        });
    } else {
      answer = {
        questionId: question.questionIdentifier,
        autoWaive: question.autoWaive,
        answers: {
          // previous: event.value === 'true' ? true : false,
          previous: question.answer === true ? true : false,
          actual: null,
        },
      };
    }

    if (this.questionsAnswersList.length === 0 || !this.questionAnswerExist(question.questionIdentifier)) {
      if (
        this.questionsAnswersList.filter((quAnswer) => quAnswer.applicantSequence === this.applicantSequence())
          .length === 0
      ) {
        this.questionsAnswersList.push({
          // applicantType: this.applicantType,
          applicantSequence: this.applicantSequence() ? this.applicantSequence() : 0,
          previouslyAnswered: false,
          questionsAnswers: [answer],
        });
      } else {
        this.questionsAnswersList
          .filter((questionAnswer) => questionAnswer.applicantSequence === this.applicantSequence())[0]
          .questionsAnswers.push(answer);
      }
    }

    if (this.selectedInsuranceType === INSURANCE_TYPE.SINGLE_PREMIUM) {
      this.healthSPQuestions
        .filter((byApplicant) => byApplicant.applicantSequence === this.applicantSequence())
        .forEach((spQuestion) => {
          const individualQuestion = spQuestion.healthQuestionsDto.filter(
            (byIdentifier) => byIdentifier.questionIdentifier === question.questionIdentifier
          )[0];
          if (individualQuestion !== undefined) {
            // individualQuestion.answer = event.value === 'true' ? true : false;
            individualQuestion.answer = question.answer;
          }
        });
    } else {
      this.healthQuestions
        .filter((healthQuestion) => healthQuestion.applicantSequence === this.applicantSequence())
        .filter((applicantAnswer) => applicantAnswer.questionIdentifier === question.questionIdentifier)[0].answer =
        // event.value === 'true' ? true : false;
        question.answer;
    }

    if (question.autoWaive && question.answer) {
      this.stepperMessage.messageContent = {
        message: 'This answer will cause an auto-waiver for some coverages.',
        type: MessageType.INFO,
        showIt: true,
        time: 3800,
      };
    }

    if (question.autoWaive && !question.answer) {
      this.stepperMessage.messageContent = initialMessageState();
    }
  }

  /**
   * This function let the user know that something happen when the answer is YES
   */
  // public changeQuestion(event: MatRadioChange, question: any) {
  //   let answer!: questionAnswer;
  //   const previouslyAnswered =
  //     this.questionsAnswersList.filter((answer) => answer.previouslyAnswered === true).length > 0;
  //   if (previouslyAnswered) {
  //     this.questionsAnswersList
  //       .filter((answer) => answer.applicantSequence === this.applicantSequence)[0]
  //       .questionsAnswers.filter((qAnswer) => qAnswer.questionId === question.questionIdentifier)
  //       .forEach((answerQu) => {
  //         if (answerQu.answers.actual === null) {
  //           this.answerWasNull = true;
  //         }
  //         answerQu.answers.actual = event.value === 'true' ? true : false;
  //       });
  //   } else {
  //     answer = {
  //       questionId: question.questionIdentifier,
  //       autoWaive: question.autoWaive,
  //       answers: {
  //         previous: event.value === 'true' ? true : false,
  //         actual: null,
  //       },
  //     };
  //   }

  //   if (this.questionsAnswersList.length === 0 || !this.questionAnswerExist(question.questionIdentifier)) {
  //     if (
  //       this.questionsAnswersList.filter((quAnswer) => quAnswer.applicantSequence === this.applicantSequence).length ===
  //       0
  //     ) {
  //       this.questionsAnswersList.push({
  //         // applicantType: this.applicantType,
  //         applicantSequence: this.applicantSequence ? this.applicantSequence : 0,
  //         previouslyAnswered: false,
  //         questionsAnswers: [answer],
  //       });
  //     } else {
  //       this.questionsAnswersList
  //         .filter((questionAnswer) => questionAnswer.applicantSequence === this.applicantSequence)[0]
  //         .questionsAnswers.push(answer);
  //     }
  //   }

  //   if (this.selectedInsuranceType === INSURANCE_TYPE.SINGLE_PREMIUM) {
  //     this.healthSPQuestions
  //       .filter((byApplicant) => byApplicant.applicantSequence === this.applicantSequence)
  //       .forEach((spQuestion) => {
  //         const individualQuestion = spQuestion.healthQuestionsDto.filter(
  //           (byIdentifier) => byIdentifier.questionIdentifier === question.questionIdentifier
  //         )[0];
  //         if (individualQuestion !== undefined) {
  //           individualQuestion.answer = event.value === 'true' ? true : false;
  //         }
  //       });
  //   } else {
  //     this.healthQuestions
  //       .filter((healthQuestion) => healthQuestion.applicantSequence === this.applicantSequence)
  //       .filter((applicantAnswer) => applicantAnswer.questionIdentifier === question.questionIdentifier)[0].answer =
  //       event.value === 'true' ? true : false;
  //   }

  //   if (question.autoWaive && event.value === 'true' ? true : false) {
  //     this.stepperMessage.messageContent = {
  //       message: 'This answer will cause an auto-waiver for some coverages.',
  //       type: MessageType.INFO,
  //       showIt: true,
  //       time: 3800,
  //     };
  //   }

  //   if (question.autoWaive && event.value !== 'true') {
  //     this.stepperMessage.messageContent = initialMessageState();
  //   }
  // }

  private questionAnswerExist(questionId: string): boolean {
    if (this.selectedInsuranceType === INSURANCE_TYPE.SINGLE_PREMIUM) {
      return (
        this.questionsAnswersList.length > 0 &&
        this.questionsAnswersList
          .filter((que) => que.applicantSequence === this.applicantSequence())[0]
          ?.questionsAnswers.filter((answer) => answer.questionId === questionId).length > 0
      );
    } else {
      return (
        this.questionsAnswersList.length > 0 &&
        this.questionsAnswersList
          .filter((que) => que.applicantSequence === this.applicantSequence())[0]
          ?.questionsAnswers.filter((answer) => answer.questionId === questionId).length > 0
      );
    }
  }

  public answerNotForAll() {
    this.questionsForm.get(`disclaimer-${this.applicantSequence()}`)?.setValue(true);
    if (this.healthQuestions.length > 0) {
      this.healthQuestions.forEach((question) => {
        this.questionsForm.get(`question-${question.questionIdentifier}-${question.applicantType}`)?.setValue('false');
      });
    }
    if (this.healthSPQuestions.length > 0) {
      this.healthSPQuestions.forEach((question) => {
        question.healthQuestionsDto.forEach((spQuestion) => {
          this.questionsForm
            .get(`question-${spQuestion.questionIdentifier}-${spQuestion.applicantType}`)
            ?.setValue('false');
        });
      });
    }
  }
}
