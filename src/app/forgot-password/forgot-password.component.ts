import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { AuthService } from '../shared/services/auth.service';
@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  //   styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent implements OnInit {
  constructor(public authService: AuthService) {}
  forgotPasswordForm!: UntypedFormGroup;
  errorMessage!: string;
  ngOnInit() {
    this.forgotPasswordForm = new UntypedFormGroup({
      email: new UntypedFormControl('', {
        validators: [
          Validators.required,
          // Validators.email,
          Validators.pattern(
            "[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?"
          ),
          Validators.maxLength(64),
        ],
        updateOn: 'submit',
      }),
    });
  }
  async submit() {
    if (this.forgotPasswordForm.valid) {
      try {
        const email = this.forgotPasswordForm.get('email')?.value;
        if (email) {
          this.authService.ForgotPassword(email);
        }
      } catch (error: any) {
        switch (error.code) {
          case 'auth/invalid-email':
            this.errorMessage = 'Invalid Email.';
            break;
          default:
            this.errorMessage = error.message;
            break;
        }
      }
    }
  }
}
