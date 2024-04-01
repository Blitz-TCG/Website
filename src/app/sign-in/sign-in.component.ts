import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, HostListener, Inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { AuthService } from '../shared/services/auth.service';
@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent implements OnInit {
  @ViewChild('stickyElem', { static: false }) menuElement?: ElementRef;
  sticky: boolean = false;
  constructor(public authService: AuthService, @Inject(PLATFORM_ID) private platformId: any) { }
  signinForm!: UntypedFormGroup;
  errorMessage!: string;
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      var f = document.getElementsByTagName('FORM');
      for (var i = 0; i < f.length; i++) {
        (function (i) {
          //@ts-ignore
          f[i].elements[f[i].length - 1].onkeydown = function (e) {
            var keyCode = e.keyCode || e.which;
            if (keyCode == 9) {
              //@ts-ignore
              f[i].elements[0].focus();
              e.preventDefault();
            }
          };
        })(i);
      }
    }
    this.signinForm = new UntypedFormGroup({
      email: new UntypedFormControl('', {
        validators: [
          Validators.required,
          Validators.pattern(
            "[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\\.)+[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?"
          ),
          Validators.maxLength(64),
        ],
        updateOn: 'submit',
      }),
      password: new UntypedFormControl('', {
        validators: [Validators.required],
        updateOn: 'submit',
      }),
    });
  }

  async submit() {
    if (this.signinForm.valid) {
      try {
        const email = this.signinForm.get('email')?.value;
        const password = this.signinForm.get('password')?.value;
        if (email && password) {
          await this.authService.SignIn(email, password);
        }
      } catch (error: any) {
        switch (error.code) {
          case 'auth/invalid-email':
            this.errorMessage = 'Invalid Email.';
            break;
          case 'auth/user-not-found':
            this.errorMessage = 'User does not exist.';
            break;
          case 'auth/user-not-found':
            this.errorMessage = 'User does not exist.';
            break;
          case 'auth/wrong-password':
            this.errorMessage = 'Wrong Password';
            break;
          case 'auth/wrong-password':
            this.errorMessage = 'Wrong Password';
            break;
          default:
            this.errorMessage = error.message;
            break;
        }
      }
    }
  }
  get email() {
    return this.signinForm.get('email');
  }
  get password() {
    return this.signinForm.get('password');
  }
  @ViewChild('input', { static: false })
  set input(element: ElementRef<HTMLInputElement>) {
    if (element) {
      element.nativeElement.focus();
    }
  }

  @HostListener('window:scroll', ['$event'])
  handleScroll() {
    if (isPlatformBrowser(this.platformId)) {
      const windowScroll = window.pageYOffset;
      if (windowScroll > 0) {
        this.sticky = true;
      } else {
        this.sticky = false;
      }
    }
  }
}
