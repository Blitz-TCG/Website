// // Angular imports
// import { isPlatformBrowser } from '@angular/common';
// import { HttpClient } from '@angular/common/http';
// import { Component, ElementRef, HostListener, Inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';

// // Firebase imports
// import { AngularFireAuth } from '@angular/fire/compat/auth';
// import { AngularFireDatabase } from '@angular/fire/compat/database';

// // RxJS imports
// import { Observable, of } from 'rxjs';
// import { catchError, map, mapTo, switchMap, take, tap } from 'rxjs/operators';

// // Swiper imports
// import SwiperCore, { Pagination } from 'swiper';
// import { SwiperComponent } from 'swiper/angular';
// SwiperCore.use([Pagination]);

// // Service and other imports
// import { ModalService } from '../modal/modal.service';
// import { AuthService } from '../shared/services/auth.service';
// import { WalletService } from '../wallet.service';

// @Component({
//   selector: 'app-market',
//   templateUrl: './market.component.html',
//   styleUrls: ['./market.component.scss']
// })

// export class MarketComponent implements OnInit {
//   @ViewChild('swiper', { static: false }) swiper?: SwiperComponent;
//   @ViewChild('stickyElem', { static: false }) menuElement?: ElementRef;
//   @ViewChild('cardNameInput', { static: false }) cardNameInput!: ElementRef<HTMLInputElement>;
//   @ViewChild('ownedCardsOnlyCheckbox') ownedCardsOnlyCheckbox!: ElementRef<HTMLInputElement>;
//   sticky: boolean = false;
//   activeIndex: any;
//   activeTab = "Buy";
//   sellActiveTab = "Owned";
//   filter = {
//     sort: {
//       name: "Recently Listed",
//       value: "0"
//     },
//     edition: {
//       name: "All",
//       value: "All"
//     },
//     set: {
//       name: "All",
//       value: "All"
//     },
//     faction: {
//       name: "All",
//       value: "All"
//     },
//     rarity: {
//       name: "All",
//       value: "All"
//     },
//     bracket: {
//       name: "All",
//       value: "All"
//     },
//     artist: {
//       name: "All",
//       value: "All"
//     }
//   }
//   isChecked = false;
//   cardsPages = 7;
//   perPage = 24;
//   currentCardPage = 1;
//   walletID: any = null;
//   tokenIds: any = [];
//   cards: any = [];
//   cardsByTab: any = [];
//   filtedCards: any = [];
//   showCards: any = [];
//   applyedFilter: boolean = false;
//   selectedCard: any = null;
//   isLoading = '';
//   message: string | null = null;
//   isSuccessful = false;

//   constructor(private walletService: WalletService, private http: HttpClient, private modalService: ModalService, public adb: AngularFireDatabase, private httpClient: HttpClient, public afAuth: AngularFireAuth, public authService: AuthService, @Inject(PLATFORM_ID) private platformId: any) { }
//   private baseUrl = 'https://api.skyharbor.io/api/sales'
//   ngOnInit(): void {
//     this.fetchWalletAndLoadErgoTokens();
//   }

//   loadErgoTokens(): Observable<void> {
//     if (this.walletID) {
//       return this.httpClient.get('https://ergo-explorer.anetabtc.io/api/v1/addresses/' + this.walletID + '/balance/confirmed')
//         .pipe(
//           catchError(error => {
//             console.log('Error loading Ergo tokens:', error);
//             return of(); // Return an empty observable
//           }),
//           tap((response: any) => {
//             if (response) {
//               const dataObjects: any = response;
//               for (const token of dataObjects.tokens) {
//                 const tokenDecimals = Math.pow(10, token.decimals);
//                 this.tokenIds.push({ tokenId: token.tokenId, amount: token.amount / tokenDecimals });
//               }
//             }
//           })
//         );
//     } else {
//       console.log('No wallet ID');
//       return of(); // Return an empty observable
//     }
//   }
//   private fetchWalletAndLoadErgoTokens(): void {
//     this.afAuth.authState
//       .pipe(
//         take(1),
//         switchMap(() => this.walletService.getWalletAddress()),
//         tap(() => {
//           this.walletID = this.walletService.getWalletId();
//           console.log('Wallet ID:', this.walletID);
//         }),
//         switchMap(() => this.getNFTs()),
//         switchMap(() => this.loadErgoTokens()),
//       )
//       .subscribe(
//         error => console.log('Error querying cards:', error)
//       );
//   }
//   walletConnected(): any {
//     if (isPlatformBrowser(this.platformId)) {
//       return localStorage.getItem('userIsConnected') != 'false';
//     }
//   }
//   // Fetch and processind response
//   fetchNFTs(): Observable<any[]> {
//     const url = `${this.baseUrl}?collection=dooodeem`;
//     return this.http.get<any[]>(url);
//   }
//   getNFTs(): Observable<void> {
//     if (!this.walletID) {
//       console.log('No wallet ID');
//       return of();
//     }

//     return this.fetchNFTs().pipe(
//       catchError(error => {
//         console.log('Error loading Ergo tokens:', error);
//         return of();
//       }),
//       tap(response => {
//         console.log(response);
//         this.processResponse(response);
//       }),
//       mapTo(void 0)  // ensures the return type is Observable<void>
//     );
//   }
//   private processResponse(response: any[]): void {
//     if (!response) return;
//     this.cards = response.sort(this.sortByListTime).map(this.mapNftToCard);
//     this.cardsByTab = this.cards.filter((nft: any) => (nft.status === "active" || nft.status === "inactive"));
//     this.showCards = this.cardsByTab.slice(0, this.perPage);
//     this.cardsPages = Math.ceil(this.cardsByTab.length / this.perPage) || 1;
//   }
//   private sortByListTime(a: any, b: any): number {
//     return new Date(b.list_time).getTime() - new Date(a.list_time).getTime();
//   }
//   mapNftToCard = (nft: any) => {
//     return {
//       ...nft,
//       image: `https://gateway.ipfs.io/ipfs/${nft.ipfs_art_hash}`,
//       name: nft.nft_name,
//       description: this.extractDescription(nft.nft_desc),
//       date: nft.list_time.substring(0, 10),
//       time_ago: this.timeAgo(nft.list_time),
//       price_erg: this.formatNumberWithDecimals(nft.nerg_sale_value, nft.decimals),
//       price_usd: this.formatNumberWithDecimals(nft.nerg_service_value, 7),
//     };
//   }
//   // Tabs actions
//   selectTab(tab: string, tab2: string = 'Owned'): void {
//     this.activeTab = tab;
//     this.sellActiveTab = tab2;
//     this.clearFilters(tab, tab2)
//     if (tab === 'Sell' && (tab2 === 'Owned' || tab2 === 'Sold')) {
//       this.filter.sort = {
//         name: 'Alphabetical: A to Z',
//         value: '1'
//       }
//     } else {
//       this.filter.sort = {
//         name: 'Recently Listed',
//         value: '0'
//       }
//     }
//     switch (tab) {
//       case 'Buy':
//         this.filterBuy();
//         break;
//       case 'Sell':
//         this.filterSell(tab2);
//         break;
//     }

//     this.currentCardPage = 1;
//     this.showCards = this.cardsByTab.slice(0, this.perPage);
//     this.cardsPages = Math.ceil(this.cardsByTab.length / this.perPage) || 1;
//   }
//   private filterBuy(): void {
//     this.cardsByTab = this.cards.filter((nft: any) => (nft.status === "active" || nft.status === "inactive"));
//   }
//   private filterSell(tab2: string): void {
//     if (tab2 === 'Owned')
//       this.cardsByTab = this.cards.filter((nft: any) =>
//         nft.status === "complete" && this.tokenIds.some((token: any) => token.tokenId === nft["token_id"])
//       );
//     if (tab2 === 'For Sale')
//       this.cardsByTab = this.cards.filter((nft: any) =>
//         (nft.status === "active") && nft["seller_address"] === this.walletID
//       );
//     if (tab2 === 'Sold')
//       this.cardsByTab = this.cards.filter((nft: any) =>
//         nft.status === "complete" && nft["buyer_address"] === this.walletID
//       );
//   }
//   // Modal actions
//   openPopup(card: any, showDetails = true, modalType = this.activeTab, sellActiveTab = this.sellActiveTab) {
//     if (this.authService.isLoggedIn && this.walletConnected()) {
//       this.modalService.openModal({ ...card, showDetails, modalType, sellActiveTab });
//     }
//   }
//   closeModal() {
//     this.modalService.close();
//   }
//   // Pagination functions
//   updateDisplayedCards() {
//     this.showCards = (this.applyedFilter ? this.filtedCards : this.cardsByTab)
//       .slice(this.perPage * (this.currentCardPage - 1), this.perPage * this.currentCardPage);
//   }
//   nextPage() {
//     if (this.currentCardPage < this.cardsPages) {
//       this.currentCardPage++;
//       this.updateDisplayedCards();
//     }
//   }
//   prevPage() {
//     if (this.currentCardPage > 1) {
//       this.currentCardPage--;
//       this.updateDisplayedCards();
//     }
//   }
//   firstPage() {
//     this.currentCardPage = 1;
//     this.updateDisplayedCards();
//   }
//   lastPage() {
//     this.currentCardPage = this.cardsPages;
//     this.updateDisplayedCards();
//   }
//   // Filters and sort actions
//   toggleMenu(index: number): void {
//     this.activeIndex = this.activeIndex === index ? -1 : index;
//   }
//   clickOnMenu(
//     itemIndex: number,
//   ) {
//     if (this.activeIndex === itemIndex) this.activeIndex = null;
//     else this.activeIndex = itemIndex;
//   }
//   applyFilter(event: any = null): void {
//     this.applyedFilter = true;
//     const searchText = event ? event.target.value : null;
//     this.filtedCards = this.cardsByTab.filter((card: any) => this.isValidCard(card, searchText));
//     this.showCards = this.filtedCards.slice(0, this.perPage);
//     this.currentCardPage = 1;
//     this.cardsPages = Math.ceil(this.filtedCards.length / this.perPage) || 1;
//   }
//   private isValidCard(card: any, searchText: string): boolean {
//     return (!this.isChecked || (this.isChecked && card.amount && card.amount > 0)) &&
//       (this.filter.edition.value === 'All' || card.edition == this.filter.edition.value) &&
//       (this.filter.set.value === 'All' || card.set === this.filter.set.value) &&
//       (this.filter.faction.value === 'All' || card.faction === this.filter.faction.value) &&
//       (this.filter.rarity.value === 'All' || card.rarity === this.filter.rarity.value) &&
//       (this.filter.bracket.value === 'All' || this.filterBracket(card.bracket, this.filter.bracket.value)) &&
//       (this.filter.artist.value === 'All' || card.artist === this.filter.artist.value) &&
//       (!searchText || card.name.toLowerCase().includes(searchText.toLowerCase()));
//   }
//   filterBracket(value: number, bracketName: string) {
//     switch (bracketName) {
//       case "Lower":
//         return value >= 2 && value <= 4;
//       case "Mid":
//         return value >= 5 && value <= 8;
//       case "Upper":
//         return value >= 9 && value <= 10;
//       default:
//         return value === 1;
//     }
//   }
//   selectSort(value: string, name: string): void {
//     this.filter.sort.value = value;
//     this.filter.sort.name = name;
//     this.cardsByTab.sort((a: any, b: any) => {
//       const nameA = a.name.toLowerCase();
//       const nameB = b.name.toLowerCase();
//       const priceA = parseInt(a.nerg_sale_value);
//       const priceB = parseInt(b.nerg_sale_value);
//       const dateA: Date = new Date(a.list_time);
//       const dateB: Date = new Date(b.list_time);

//       switch (value) {
//         case '0':
//           return dateB.getTime() - dateA.getTime();
//         case '1':
//           return nameA.localeCompare(nameB);
//         case '2':
//           return nameB.localeCompare(nameA);
//         case '3':
//           return priceA - priceB;
//         case '4':
//           return priceB - priceA;
//         default:
//           return 0;
//       }
//     });

//     this.applyFilter();
//     this.toggleMenu(6);
//   }
//   setFilterAndToggleMenu(filterKey: keyof typeof this.filter, value: string, name: string, menuIndex: number): void {
//     this.filter[filterKey].value = value;
//     this.filter[filterKey].name = name;
//     this.applyFilter();
//     this.toggleMenu(menuIndex);
//   }
//   selectEdition(value: string, name: string): void {
//     this.setFilterAndToggleMenu('edition', value, name, 0);
//   }
//   selectSet(value: string, name: string): void {
//     this.setFilterAndToggleMenu('set', value, name, 1);
//   }
//   selectfaction(value: string, name: string): void {
//     this.setFilterAndToggleMenu('faction', value, name, 2);
//   }
//   selectRarity(value: string, name: string): void {
//     this.setFilterAndToggleMenu('rarity', value, name, 3);
//   }
//   selectBracket(value: string, name: string): void {
//     this.setFilterAndToggleMenu('bracket', value, name, 4);
//   }
//   selectArtist(value: string, name: string): void {
//     this.setFilterAndToggleMenu('artist', value, name, 5);
//   }
//   clearFilters(tab: string | null = null, tab2: string | null = null) {
//     this.filter = {
//       sort: {
//         ... (tab === 'Sell' && (tab2 === 'Owned' || tab2 === 'Sold')) ? {
//           name: 'Alphabetical: A to Z',
//           value: '1'
//         } : {
//           name: 'Recently Listed',
//           value: '0'
//         }
//       },
//       edition: {
//         name: "All",
//         value: "All"
//       },
//       set: {
//         name: "All",
//         value: "All"
//       },
//       faction: {
//         name: "All",
//         value: "All"
//       },
//       rarity: {
//         name: "All",
//         value: "All"
//       },
//       bracket: {
//         name: "All",
//         value: "All"
//       },
//       artist: {
//         name: "All",
//         value: "All"
//       }
//     }
//     if (this.ownedCardsOnlyCheckbox) {
//       this.ownedCardsOnlyCheckbox.nativeElement.checked = false;
//       this.isChecked = false;
//     }
//     this.cardNameInput.nativeElement.value = '';
//     this.applyedFilter = false;
//   }
//   // Formating functions
//   formatNumberWithDecimals(numberStr: string, decimals: number) {

//     // Extract parts
//     const integerPart = decimals < numberStr.length ? numberStr.substring(0, numberStr.length - decimals) : '0';
//     const rawDecimalPart = numberStr.substring(numberStr.length - decimals);
//     const decimalPart = rawDecimalPart.substring(0, 2); // Take only first 2 characters

//     // Format the integer part with commas
//     const formattedInteger = parseFloat(integerPart).toLocaleString('en-US');

//     // If the decimal part is '00', return only the integer part
//     if (decimalPart === '00') {
//       return formattedInteger;
//     }

//     // Otherwise, concatenate the formatted integer part with the decimal part
//     return formattedInteger + "." + decimalPart;
//   }
//   buyNFT(boxId: string) {
//     this.isLoading = boxId;
//     const testURL = `https://skyharbor.io/api/transactions/buy`;
//     const data = {
//       "userAddresses": [this.walletID],
//       "buyBox": {
//         box_id: boxId
//       }
//     };
//     this.http.post(testURL, data).subscribe(
//       response => {
//         this.isLoading = '';
//         this.isSuccessful = true;
//         console.log(response);
//         this.message = 'Purchase successful!';
//       },
//       error => {
//         const { error: { message } } = error
//         console.log(error);
//         this.isLoading = '';
//         this.message = message;
//         this.isSuccessful = true;
//         console.error('Error purchasing NFT:', error);
//       }
//     );
//   }
//   onImageLoad(card: any) {
//     card.isLoaded = true;
//     card.imageLoaded = true;
//   }
//   onImageError(card: any) {
//     card.isLoaded = true;
//     card.imageLoaded = false;
//   }
//   private extractDescription(description: string) {
//     try {
//       // Try to parse the description as JSON
//       const jsonData = JSON.parse(description);

//       // If parsing succeeds and the parsed object has a 'description' field, return that
//       if (jsonData.description) {
//         return jsonData.description;
//       }
//     } catch (error) {
//       // If there's an error in parsing, it means the description was not a JSON string
//       // So, just return the original description
//     }
//     return description;
//   }
//   private timeAgo(dateTimeStr: string) {
//     // Parse the provided date string
//     const pastDate: any = new Date(dateTimeStr);

//     // Get the current date and time
//     const currentDate: any = new Date();

//     // Calculate the difference in milliseconds
//     const diffMilliseconds = currentDate - pastDate;

//     // Convert milliseconds to minutes, hours, days
//     const diffMinutes = Math.floor(diffMilliseconds / (1000 * 60));
//     const diffHours = Math.floor(diffMinutes / 60);
//     const diffDays = Math.floor(diffHours / 24);

//     if (diffMinutes < 60) {
//       return `Listed ${diffMinutes} minutes ago`;
//     } else if (diffHours < 24) {
//       return `Listed ${diffHours} hours ago`;
//     } else if (diffDays < 30) {
//       return `Listed ${diffDays} days ago`;
//     } else {
//       const diffMonths = Math.floor(diffDays / 30);
//       return `Listed ${diffMonths} months ago`;
//     }
//   }
//   @HostListener('window:scroll', ['$event'])
//   handleScroll() {
//     if (isPlatformBrowser(this.platformId)) {
//       const windowScroll = window.pageYOffset;
//       if (windowScroll > 0) {
//         this.sticky = true;
//       } else {
//         this.sticky = false;
//       }
//     }
//   }

// }
