import { Component, OnInit, Output, EventEmitter, output, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { AuthService } from '../../../auth.service';
import { EnumService } from '../../services/insurance/enum.service';
import { getUserRoleList } from '../../utils/enums/system-enums';
import { NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [MatIconModule, NgIf, MatMenuModule],
})
export class HeaderComponent implements OnInit {
  navExpandEvent = output<boolean>();

  private router = inject(Router);
  private enumService = inject(EnumService);
  private authService = inject(AuthService);
  public titleService = inject(Title);
  public route = inject(ActivatedRoute);

  public navBarExpand = false;
  public isSettingsVisible: boolean = false;

  ngOnInit() {
    // Get user role from sessionStorage
    const userInfo = sessionStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        let userAdmin = this.enumService.getAbbreviationBySystemValue(getUserRoleList(), '1');
        this.isSettingsVisible = userAdmin == parsed.role;
      } catch {
        this.isSettingsVisible = false;
      }
    }
  }

  logout() {
    this.authService.logout();
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

  profile() {
    this.router.navigate(['profile']);
  }

  public settings() {
    this.router.navigate(['settings']);
  }

  public toggleNavBar() {
    this.navBarExpand = !this.navBarExpand;
    this.navExpandEvent.emit(this.navBarExpand);
  }
}
