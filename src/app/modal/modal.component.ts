import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ModalService } from './modal.service';
import { switchMap, take, tap } from 'rxjs';
import { WalletService } from '../wallet.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit {
  activeIndex: any;
  selectedCard: any = null;
  displayStyle = "none";
  currency = 'erg';
  modalType: any = null;
  showDetails = true;
  price: string = "";
  isValid: boolean = true;
  walletID: any = null;
  isLoading = false;
  message: string | null = null;
  isSuccessful = false;
  IMMEDIATE_FEES = 0.03;

  @ViewChild('modalContainer') modalContainer!: ElementRef;

  constructor(private walletService: WalletService, private http: HttpClient, private modalService: ModalService, private elementRef: ElementRef, public afAuth: AngularFireAuth) { }

  ngOnInit() {
    this.fetchWalletAndLoadErgoTokens();
    this.modalService.modalData$.subscribe(data => {
      this.selectedCard = data;
      this.displayStyle = "block";
      this.showDetails = data.showDetails;
      this.modalType = data.modalType;
      // Perform any additional logic with the data
    });
    console.log(this.walletID)
  }
  private fetchWalletAndLoadErgoTokens(): void {
    this.afAuth.authState
      .pipe(
        take(1),
        switchMap(() => this.walletService.getWalletAddress()),
        tap(() => {
          this.walletID = this.walletService.getWalletId();
          console.log('Wallet ID:', this.walletID);
        })
      )
      .subscribe(
        cards => console.log('Cards:', cards),
        error => console.log('Error querying cards:', error)
      );
  }
  @HostListener('document:keydown.escape')
  onEscapeKeyDown() {
    this.closeModal();
  }
  onClickOutsideModal(event: MouseEvent): void {
    const clickedElement = event.target as HTMLElement;

    // Check if the clicked element has the class "card-btn"
    if (clickedElement.classList.contains('card-btn')) {
      return; // Do nothing if the clicked element is a card button
    }

    // Continue with the rest of the code
    if (this.selectedCard) {
      const modalContainerElement = this.elementRef.nativeElement;
      const modalElement = modalContainerElement.querySelector('#cardModal');
      if (modalElement && !modalElement.contains(clickedElement)) {
        this.closeModal();
      }
    }
  }
  closeModal() {
    this.modalService.close();
    this.price = "";
    this.isValid = true;
    this.isLoading = false;
    this.message = null;
    this.displayStyle = "none";
    this.showDetails = true;
  }
  toggleMenu(index: number): void {
    this.activeIndex = this.activeIndex === index ? -1 : index;
  }
  getBracket(bracket: number) {
    if (bracket >= 2 && bracket <= 4)
      return "Lower";
    else if (bracket >= 5 && bracket <= 8)
      return "Mid";
    else if (bracket >= 9 && bracket <= 10)
      return "Upper";
    else
      return "Starter";
  }
  selectCurrency(currency: string) {
    this.currency = currency;
  }
  checkInput(event: any) {
    this.message = null;
    const value = event.target.value;

    // Remove any character that's not a digit or a decimal point
    const cleanValue = value.replace(/[^\d.]/g, '');

    // Replace multiple decimal points with a single one
    const singleDotValue = cleanValue.replace(/[.]+/g, '.');

    // Validate format
    const validFormat = /^\d+(\.\d{1,2})?$/.test(singleDotValue);

    if (validFormat || singleDotValue === "") {
      this.isValid = true;
    } else {
      this.isValid = false;
    }

    // Update the input value
    this.price = singleDotValue;
  }
  listingNFTs(tokenId: string) {
    if (this.price !== "" && parseFloat(this.price) > 0) {
      this.isLoading = true;
      const testURL = `https://testapi.skyharbor.io/api/transactions/list`;
      console.log({
        id: tokenId,
        price: Math.round(parseFloat(this.price) + parseFloat(this.calculateFee()) + this.IMMEDIATE_FEES),
        currency: this.currency,
      });
      const data = {
        nfts: {
          id: tokenId,
          price: Math.round(parseFloat(this.price) + parseFloat(this.calculateFee()) + this.IMMEDIATE_FEES),
          currency: this.currency,
        },
        userAddresses: [this.walletID]
      };

      this.http.post(testURL, data).subscribe(
        response => {
          this.isLoading = false;
          this.isSuccessful = true;
          this.message = 'Listing successful!';
        },
        error => {
          const { error: { message } } = error
          this.isLoading = false;
          this.message = message;
          this.isSuccessful = false;
          console.error('Error listing NFT:', message);
        }
      );
    } else {
      this.isValid = false;
      this.message = 'Please enter a valid price before submitting.';
      return;
    }
  }
  delistNFT(tokenId: string) {
    this.isLoading = true;
    const testURL = `https://testapi.skyharbor.io/api/transactions/delist`;
    console.log({
      id: tokenId,
    });
    const data = {
      userAddresses: [this.walletID],
      "cancelBox": tokenId,
    }

    this.http.post(testURL, data).subscribe(
      response => {
        this.isLoading = false;
        this.isSuccessful = true;
        this.message = 'Delisting successful!';
      },
      error => {
        const { error: { message } } = error
        this.isLoading = false;
        this.message = message;
        this.isSuccessful = false;
        console.error('Error listing NFT:', message);
      }
    );
  }
  editNFT(tokenId: string) {
    if (this.price !== "" && parseFloat(this.price) > 0) {
      this.isLoading = true;
      const testURL = `https://testapi.skyharbor.io/api/transactions/edit`;
      console.log({
        id: tokenId,
        price: Math.round(parseFloat(this.price) + parseFloat(this.calculateFee()) + this.IMMEDIATE_FEES),
        currency: this.currency,
      });
      const data = {
        "userAddresses": [this.walletID],
        "editBox": tokenId,
        "newPrice": Math.round(parseFloat(this.price) + parseFloat(this.calculateFee()) + this.IMMEDIATE_FEES),
        "currency": this.currency

      }
      this.http.post(testURL, data).subscribe(
        response => {
          this.isLoading = false;
          this.isSuccessful = true;
          this.message = 'Editing successful!';
        },
        error => {
          const { error: { message } } = error
          this.isLoading = false;
          this.message = message;
          this.isSuccessful = false;
          console.error('Error listing NFT:', message);
        }
      );
    } else {
      this.isValid = false;
      this.message = 'Please enter a valid price before submitting.';
      return;
    }
  }
  buyNFT(boxId: string) {
    this.isLoading = true;
    const testURL = `https://testapi.skyharbor.io/api/transactions/buy`;
    const data = {
      "userAddresses": [this.walletID],
      "buyBox": {
        box_id: boxId
      }
    };

    this.http.post(testURL, data).subscribe(
      response => {
        this.isLoading = false;
        this.isSuccessful = true;
        this.message = 'Purchase successful!';
      },
      error => {
        const { error: { message } } = error
        this.isLoading = false;
        this.message = message;
        this.isSuccessful = false;
        console.error('Error purchasing NFT:', message);
      }
    );
  }
  calculateFee() {
    const fee = parseFloat(this.price || '0') * 0.02;
    return fee.toFixed(2);
  }
  calculateYouEarn(cardPrice: string) {
    const youEarn = parseFloat(this.price || '0') - parseFloat(cardPrice || '0') - parseFloat(this.calculateFee()) - this.IMMEDIATE_FEES;
    return youEarn > 0 ? youEarn.toFixed(2) : 0;
  }
  onImageLoad(card: any) {
    card.isLoaded = true;
    card.imageLoaded = true;
  }
  onImageError(card: any) {
    card.isLoaded = true;
    card.imageLoaded = false;
  }
}
