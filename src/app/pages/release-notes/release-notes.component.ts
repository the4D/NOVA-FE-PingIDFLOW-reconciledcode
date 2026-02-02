import { Component } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { RELEASE_RAW_DATA, ReleaseData } from './release-notes-utils';

@Component({
  selector: 'app-release-notes',
  templateUrl: './release-notes.component.html',
  styleUrls: ['./release-notes.component.scss'],
  standalone: true,
  imports: [MatExpansionModule],
})
export class ReleaseNotesComponent {
  public panelOpenState: boolean = false;
  public releaseNoteList: ReleaseData = RELEASE_RAW_DATA;

  public callShowState = (yearIndex: string, monthDetailIndex: string): void => {
    (<HTMLInputElement>document.getElementById(yearIndex + monthDetailIndex)).innerHTML = 'Hide Details';
  };

  public callHideState = (yearIndex: string, monthDetailIndex: string): void => {
    (<HTMLInputElement>document.getElementById(yearIndex + monthDetailIndex)).innerHTML = 'Show Details';
  };
}
