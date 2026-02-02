import { U } from '@angular/cdk/keycodes';
import { Component, input, OnInit, output } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { MatRadioButton, MatRadioChange, MatRadioGroup } from '@angular/material/radio';
import { HealthQuestionDto } from '@core/models/insurance/health-question.model';

@Component({
  selector: 'app-question',
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.css'],
  imports: [MatDividerModule, MatRadioButton, FormsModule, ReactiveFormsModule, MatRadioGroup],
  standalone: true,
})
export class QuestionComponent implements OnInit {
  selectedInsuranceType = input.required<string>();
  questionIdentifier = input.required<number>();
  question = input.required<HealthQuestionDto>();

  questionAnswered = output<HealthQuestionDto>();

  public questionForm: FormGroup = new FormGroup({});

  ngOnInit() {
    this.addControl();
  }

  private addControl() {
    if (
      !this.questionForm.contains(`question-${this.question().questionIdentifier}-${this.question().applicantType}`)
    ) {
      if (this.question().answer !== null) {
        this.questionForm.addControl(
          `question-${this.question().questionIdentifier}-${this.question().applicantType}`,
          new FormControl(this.question().answer, Validators.required)
        );
      } else {
        this.questionForm.addControl(
          `question-${this.question().questionIdentifier}-${this.question().applicantType}`,
          new FormControl('', Validators.required)
        );
      }
    }
  }

  public changeQuestion(event: MatRadioChange, question: HealthQuestionDto) {
    question.answer = event.value === 'true' ? true : false;
    this.questionAnswered.emit(question);
  }
}
