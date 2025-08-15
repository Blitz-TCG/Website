import { isPlatformBrowser, Location } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  UntypedFormControl,
  UntypedFormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { CustomValidators } from '../custom-validators';
import { AuthService } from '../shared/services/auth.service';
import { blockedWords } from '../shared/services/blocked';
@Component({
    selector: 'app-sign-up',
    templateUrl: './sign-up.component.html',
    styleUrls: ['./sign-up.component.scss'],
    standalone: false
})
export class SignUpComponent implements OnInit {
  @ViewChild('stickyElem', { static: false }) menuElement?: ElementRef;
  sticky: boolean = false;
  constructor(public authService: AuthService, private location: Location, @Inject(PLATFORM_ID) private platformId: any) { }
  registerForm!: UntypedFormGroup;
  errorMessage!: string;
  submitted: boolean = false;

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
    this.registerForm = new UntypedFormGroup(
      {
        email: new UntypedFormControl('', {
          validators: [
            Validators.required,
            // Validators.email,
            Validators.pattern(
              "[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\\.)+[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?"
            ),
            Validators.maxLength(64),
          ],
          updateOn: 'submit',
        }),
        username: new UntypedFormControl('', {
          validators: [
            Validators.required,
            Validators.pattern(
              '[-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz]+'
            ),
            Validators.minLength(1),
            Validators.maxLength(12),
            this.forbiddenNameValidator('/' + blockedWords.join('|') + '/g'),
          ],
          updateOn: 'submit',
        }),
        password: new UntypedFormControl('', {
          validators: [
            Validators.required,
            Validators.minLength(8),
            CustomValidators.patternValidator(/\d/, { hasNumber: true }),
            CustomValidators.patternValidator(/[A-Z]/, {
              hasCapitalCase: true,
            }),
            CustomValidators.patternValidator(/[a-zA-Z]/, { hasLetter: true }),
            CustomValidators.patternValidator(
              /[!@#$%^&*()+=-\?;,./{}|\":<>\[\]\\\' ~_]/,
              {
                hasSpecialCharacters: true,
              }
            ),
          ],
          updateOn: 'submit',
        }),
        confirmPassword: new UntypedFormControl('', {
          validators: [Validators.required],
          updateOn: 'submit',
        }),
      },
      [CustomValidators.MatchValidator('password', 'confirmPassword')]
    );
  }

  forbiddenNameValidator(emailRe: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      var rgx = new RegExp(emailRe);
      const forbidden = rgx.test(control.value);
      return forbidden ? { forbiddenName: { value: control.value } } : null;
    };
  }
  async submit() {
    if (this.registerForm.valid) {
      try {
        const email = this.registerForm.get('email')?.value;
        const username = this.registerForm.get('username')?.value;
        const password = this.registerForm.get('password')?.value;
        if (email && username && password) {
          await this.authService.SignUp(email, username, password);
        }
      } catch (error: any) {
        this.errorMessage =
          error.name === 'USERNAME_EXISTS'
            ? error.message
            : 'The email address is already in use by another account.';
      }
    }
    this.submitted = true;
  }
  get email() {
    return this.registerForm.get('email');
  }
  get username() {
    return this.registerForm.get('username');
  }
  get password() {
    return this.registerForm.get('password');
  }
  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }
  get passwordMatchError() {
    return (
      this.registerForm.getError('mismatch') &&
      this.registerForm.get('confirmPassword')?.touched
    );
  }
  @ViewChild('input', { static: false })
  set input(element: ElementRef<HTMLInputElement>) {
    if (element) {
      element.nativeElement.focus();
    }
  }
  back(): void {
    this.location.back();
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
