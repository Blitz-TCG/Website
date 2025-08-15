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
  cards: any[] = [];
  displayStyle = "none";
  currency = 'erg';
  modalType: any = null;
  sellActiveTab: any = null;
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
      this.cards = data.cards;
      this.selectedCard = data.card;
      this.displayStyle = "block";
      this.showDetails = data.showDetails;
      this.modalType = data.modalType;
      this.sellActiveTab = data.sellActiveTab;
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
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.displayStyle === "block") {  // This assumes that `displayStyle` being "block" means the modal is open.
      switch (event.key) {
        case 'ArrowRight':
          this.navigateNext();  // Method to navigate to the next card
          break;
        case 'ArrowLeft':
          this.navigatePrevious();  // Method to navigate to the previous card
          break;
      }
    }
  }
  navigateNext() {
    if (!this.cards || this.cards.length === 0) {
      console.error('Card array is not initialized or empty');
      return;
    }
    let currentIndex = this.cards.findIndex(card => card === this.selectedCard);
    let nextIndex = currentIndex + 1;
    if (nextIndex < this.cards.length) {
      this.selectedCard = this.cards[nextIndex];
    }
  }

  navigatePrevious() {
    if (!this.cards || this.cards.length === 0) {
      console.error('Card array is not initialized or empty');
      return;
    }
    let currentIndex = this.cards.findIndex(card => card === this.selectedCard);
    let prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      this.selectedCard = this.cards[prevIndex];
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
      return "Middle";
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
        (response) => {
          // Nautilus tx:
          if (typeof ergoConnector !== 'undefined' && ergoConnector.nautilus) {
            ergoConnector.nautilus
              .connect()
              .then((access_granted) => {
                if (!access_granted) {
                  console.error('Wallet connection not granted.');
                  this.message =
                    'Wallet connection was not granted. Please ensure your wallet is connected.';
                  this.isSuccessful = false;
                  return;
                }

                // Define the transaction object
                // @ts-ignore
                const transactionObject = response?.transaction_to_sign;

                // Now send the transaction using ergo
                window.ergo
                  .sign_tx(transactionObject)
                  .then((response: any) => {
                    ergo
                      .submit_tx(response)
                      .then((txRes) => {
                        console.log('Transaction response:', response);
                        this.isSuccessful = true;
                        this.message = `Transaction successful with transaction ID: ${txRes}`;
                      })
                      .catch((err) => {
                        this.isSuccessful = false;
                        console.log('ERR', err);
                        this.message = err.toString();
                      });
                  })
                  .catch((error: { toString: () => string | null }) => {
                    console.error('Transaction error:', error);
                    this.isSuccessful = false;
                    //@ts-ignore
                    this.message = `Error listing NFT: ${error?.info || ''}`;
                  });
              })
              .catch((error) => {
                console.error(`Error connecting to the wallet: ${error}`);
                this.isSuccessful = false;
                this.message =
                  'Error connecting to the wallet. Please try again.';
              });
          } else {
            console.log('Nautilus wallet extension is not detected.');
            alert(
              'Nautilus wallet is not detected. Please install the Nautilus wallet extension to proceed.'
            );
            this.isSuccessful = false;
            this.message = 'Nautilus wallet extension is not detected.';
          }

          // this.isLoading = false;
          // this.isSuccessful = true;
          // this.message = 'Listing successful!';
        },
        (error) => {
          const {
            error: { message },
          } = error;
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

  // The buyNFT function in market.component.ts is the real one being used
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
  calculateYouEarn() {//cardPrice: string) {
    const youEarn = parseFloat(this.price || '0') - parseFloat(this.calculateFee()) - this.IMMEDIATE_FEES;
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
