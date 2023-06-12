using System.Collections.Generic;
using System.IO;
using System.Linq;
using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class DeckManager : MonoBehaviour
{
    [Header("Buttons")]
    [SerializeField] private Button addDeck;
    [SerializeField] private Button editDeck;
    [SerializeField] private Button[] buttons;
    [SerializeField] private Button saveButton;
    [SerializeField] private Button deleteButton;
    [SerializeField] private Button addOrRemove;
    [SerializeField] private Button backButton;

    [Header("Game objects")]
    [SerializeField] private GameObject options;
    [SerializeField] private GameObject addDeckObject;
    [SerializeField] private GameObject editDeckObject;
    [SerializeField] private GameObject availableListOfCard;
    [SerializeField] private GameObject currentListOfCard;
    [SerializeField] private GameObject search;
    [SerializeField] public GameObject popUpPanel;
    [SerializeField] public GameObject toolTip;
    [SerializeField] public GameObject loading;

    [Header("images")]
    [SerializeField] private Image deckProfile;
    [SerializeField] private Image[] images;
    [SerializeField] private Card bigCardPrefab;

    [Header("static variable")]
    public static bool isAdd = false;
    public static bool isEdit = false;
    public static bool isMatch = false;
    public static int generalsIndex = 0;
    public static string parent;
    public static List<Card> availableCards = new List<Card>();
    public static List<Card> currentCards = new List<Card>();

    [Header("Cards")]
    public Card cardPrefabs;
    public List<CardDetails> cardDetails;

    private int deckId = -1;
    private int deleteDeckId;
    private int editDeckIndex;
    private string searchText;
    private Card cardInstance;

    private List<Card> newMatchAvCards = new List<Card>();
    private List<Card> newUnmatchAvCards = new List<Card>();
    private List<Card> newCurrCards = new List<Card>();

    private List<CardDetails> matchedCardListForAvailable = new List<CardDetails>();
    private List<CardDetails> unmatchedCardListForAvailable = new List<CardDetails>();

    private Color[] colors = { Color.red, Color.green, Color.blue };
    private Color enableColor = new Vector4(1f, 1f, 1f, 1f);
    private Color disableColor = new Vector4(200f / 255f, 200f / 255f, 200f / 255f, 128f / 255f);

    private int countOfLevelOne = 0;
    private int[] tempAvailCard;
    private int[] tempCurrCard;

    private void Start()
    {
        EnableOrDisable(editDeck, disableColor, false);
        deckProfile.enabled = false;
        DisplayDeck();
        ClearCards();
        DestroyCardList();
    }


    private void Update()
    {
        if (currentListOfCard?.transform?.childCount >= 10)
        {
            EnableOrDisable(saveButton, enableColor, true);
        }
        else
        {
            EnableOrDisable(saveButton, disableColor, false);
        }

        if (currentListOfCard?.transform?.childCount >= 10 && isEdit)
        {
            EnableOrDisable(deleteButton, enableColor, true);
        }
        else
        {
            EnableOrDisable(deleteButton, disableColor, false);
        }

        if (Input.GetKeyDown(KeyCode.Escape))
        {
            Destroy(popUpPanel.transform.GetComponentInChildren<Card>().gameObject);
            popUpPanel.SetActive(false);
            search.GetComponent<TMP_InputField>().text = "";
        }

        if (Draggable.dragEnd)
        {
            DragEndInstance();
            if (generalsIndex != Draggable.cardclassIndex)
            {
                ActiveTooltip("You cannot use this card with this General.");
                Invoke("RemoveToolTip", 2f);
            }
            Draggable.dragEnd = false;
            search.GetComponent<TMP_InputField>().text = "";
        }
    }


    private void DragEndInstance() // Responsible for, user drag card, all cards are instantiate
    {
        newMatchAvCards.Clear();
        newUnmatchAvCards.Clear();
        DestroyCardList();

        for (int i = 0; i < availableCards.Count; i++)
        {
            if (generalsIndex == (int)availableCards[i].cardClass)
            {
                newMatchAvCards.Add(availableCards[i]);
            }
            else
            {
                newUnmatchAvCards.Add(availableCards[i]);
            }
        }

        MatchedCardInstantiate(newMatchAvCards);
        UnMatchedCardInstantiate(newUnmatchAvCards);
        CurrentCardInstantiate(currentCards);
        search.GetComponent<TMP_InputField>().text = "";
    }

    public void OnClickSingleCard(Card card) // Responsible for, when user click any card either curren or available, Popup panel open
    {
        popUpPanel = GameObject.FindGameObjectWithTag("popup").transform.GetChild(0).gameObject;

        popUpPanel.SetActive(true);
        if (card.transform.parent.parent.parent.name.Split(" ")[0] == "Available")
        {
            if (generalsIndex == (int)card.cardClass)
            {
                popUpPanel.transform.GetComponentsInChildren<Button>()[0].GetComponent<Image>().color = enableColor;
                popUpPanel.transform.GetComponentsInChildren<Button>()[0].enabled = true;
                popUpPanel.transform.GetComponentsInChildren<Button>()[0].GetComponentInChildren<TMP_Text>().text = "Add";
            }
            else
            {
                popUpPanel.transform.GetComponentsInChildren<Button>()[0].GetComponent<Image>().color = disableColor;
                popUpPanel.transform.GetComponentsInChildren<Button>()[0].enabled = false;
                popUpPanel.transform.GetComponentsInChildren<Button>()[0].GetComponentInChildren<TMP_Text>().text = "Add";
            }

            parent = "availableCards";
        }
        else if (card.transform.parent.parent.parent.name.Split(" ")[0] == "Current")
        {
            popUpPanel.transform.GetComponentsInChildren<Button>()[0].GetComponent<Image>().color = enableColor;
            popUpPanel.transform.GetComponentsInChildren<Button>()[0].enabled = true;
            popUpPanel.transform.GetComponentsInChildren<Button>()[0].GetComponentInChildren<TMP_Text>().text = "Remove";
            parent = "currentCards";
        }

        popUpPanel.transform.GetComponentsInChildren<Button>()[1].GetComponentInChildren<TMP_Text>().text = "Back";
        cardInstance = Instantiate<Card>(bigCardPrefab, popUpPanel.transform);
        cardInstance.SetProperties(card.id, card.cardName, card.cardDescription, card.attack, card.HP, card.gold, card.XP, card.ability, card.levelRequired, card.image.sprite, card.ED, card.R, card.cardClass);
    }

    public void AddOrRemoveCard() // If popuped card is matched, Add or Remove card on respective card
    {
        newMatchAvCards.Clear();
        newUnmatchAvCards.Clear();
        DestroyCardList();

        Card card = popUpPanel.transform.GetComponentInChildren<Card>();
        if (parent == "availableCards")
        {
            if ((int)card.cardClass == generalsIndex)
            {
                Card removeCard = availableCards.Find(singleCard => singleCard.cardName == card.cardName);
                if (currentCards.Count <= 24)
                {
                    availableCards.Remove(removeCard);
                    currentCards.Add(card);
                }
                else
                {
                    ActiveTooltip("You can not move more than 25 cards.");
                    Invoke("RemoveToolTip", 2f);
                }
            }
        }
        else if (parent == "currentCards")
        {
            Card removeCard = currentCards.Find(singleCard => singleCard.cardName == card.cardName);
            currentCards.Remove(removeCard);
            availableCards.Add(card);
        }

        for (int i = 0; i < availableCards.Count; i++)
        {
            if (card.cardClass == availableCards[i].cardClass)
            {
                newMatchAvCards.Add(availableCards[i]);
            }
            else
            {
                newUnmatchAvCards.Add(availableCards[i]);
            }
        }

        MatchedCardInstantiate(newMatchAvCards);
        UnMatchedCardInstantiate(newUnmatchAvCards);
        CurrentCardInstantiate(currentCards);
        Destroy(popUpPanel.transform.GetComponentInChildren<Card>().gameObject);
        popUpPanel.SetActive(false);
        search.GetComponent<TMP_InputField>().text = "";
    }

    public void OnBackFromPopUp() // When press back button from popup panel
    {
        Destroy(popUpPanel.transform.GetComponentInChildren<Card>().gameObject);
        popUpPanel.SetActive(false);
        search.GetComponent<TMP_InputField>().text = "";
    }

    public void OnClickAddDeck() // click on add deck button
    {
        options.SetActive(true);
        isAdd = true;
        EnableOrDisable(saveButton, disableColor, false);
        EnableOrDisable(deleteButton, disableColor, false);
        EnableOrDisable(editDeck, disableColor, false);
        deckProfile.enabled = false;
        isEdit = false;
    }

    public void OnClickRedGenerals(int index) // When user select red general
    {
        editDeckObject.SetActive(true);
        addDeckObject.SetActive(false);
        options.SetActive(false);
        generalsIndex = index;
        Init();
    }
    public void OnClickGreenGenerals(int index) // When user select green general
    {
        editDeckObject.SetActive(true);
        addDeckObject.SetActive(false);
        options.SetActive(false);
        generalsIndex = index;
        Init();
    }
    public void OnClickBlueGenerals(int index) // When user select blue general
    {
        editDeckObject.SetActive(true);
        addDeckObject.SetActive(false);
        options.SetActive(false);
        generalsIndex = index;
        Init();
    }

    public void OnDeckClick(int id) // Responsible for, When user click available deck
    {
        int deckLength = LoadDeckId(Application.streamingAssetsPath + "/DeckDetails/DeckId.json").id.Length;
        deckId = id;
        EnableOrDisable(editDeck, enableColor, true);
        deckProfile.enabled = true;
        deckProfile.color = colors[int.Parse(LoadDeckId(Application.streamingAssetsPath + "/DeckDetails/DeckId.json").id[id].ToString().Substring(0, 1)) - 1];
        isAdd = false;
        options.SetActive(false);
        generalsIndex = int.Parse(LoadDeckId(Application.streamingAssetsPath + "/DeckDetails/DeckId.json").id[id].ToString().Substring(0, 1));
    }


    public void Panel()
    {
        loading.SetActive(true);
        Invoke("OnClickEditDeck", 0.5f);
    }

    public void OnClickEditDeck() // User click edit deck button, all current and available card instantiate
    {

        print("edit");
        int deckIdLength = LoadDeckId(Application.streamingAssetsPath + "/DeckDetails/DeckId.json").id.Length;

        int[] editIndex = LoadDeckId(Application.streamingAssetsPath + "/DeckDetails/DeckId.json").id;
        generalsIndex = int.Parse(editIndex[deckId].ToString().Substring(0, 1));
        isEdit = true;
        int availableCardLength = LoadAvailableData(Application.streamingAssetsPath + "/DeckDetails/AvailableCards" + editIndex[deckId] + ".json").id.Length;
        int currentCardLength = LoadAvailableData(Application.streamingAssetsPath + "/DeckDetails/CurrentCards" + editIndex[deckId] + ".json").id.Length;

        tempAvailCard = new int[LoadAvailableData(Application.streamingAssetsPath + "/DeckDetails/AvailableCards" + editIndex[deckId] + ".json").id.Length];
        tempCurrCard = new int[LoadAvailableData(Application.streamingAssetsPath + "/DeckDetails/CurrentCards" + editIndex[deckId] + ".json").id.Length];

        EnableOrDisable(editDeck, disableColor, false);
        currentCards.Clear();
        availableCards.Clear();

        DestroyCardList();

        StoreIds avail = LoadAvailableData(Application.streamingAssetsPath + "/DeckDetails/AvailableCards" + editIndex[deckId] + ".json");
        StoreIds curr = LoadAvailableData(Application.streamingAssetsPath + "/DeckDetails/CurrentCards" + editIndex[deckId] + ".json");
        for (int i = 0; i < availableCardLength; i++)
        {
            tempAvailCard[i] = avail.id[i];
        }

        for (int i = 0; i < currentCardLength; i++)
        {
            tempCurrCard[i] = curr.id[i];
        }

        List<int> tempAvailList = tempAvailCard.ToList();
        List<int> tempCurrList = tempCurrCard.ToList();
        for (int i = 0; i < tempAvailList.Count; i++)
        {
            if (cardDetails.Where(card => card.id == tempAvailList[i] && (int)card.cardClass == generalsIndex).Count() == 1)
            {
                Card cardInstance = Instantiate<Card>(cardPrefabs, availableListOfCard.transform);
                cardInstance.SetProperties(cardDetails[tempAvailList[i] - 1].id, cardDetails[tempAvailList[i] - 1].cardName, cardDetails[tempAvailList[i] - 1].cardDescription, cardDetails[tempAvailList[i] - 1].attack, cardDetails[tempAvailList[i] - 1].HP, cardDetails[tempAvailList[i] - 1].gold, cardDetails[tempAvailList[i] - 1].XP, cardDetails[tempAvailList[i] - 1].ability, cardDetails[tempAvailList[i] - 1].levelRequired, cardDetails[tempAvailList[i] - 1].cardImage, cardDetails[tempAvailList[i] - 1].ED, cardDetails[tempAvailList[i] - 1].R, cardDetails[tempAvailList[i] - 1].cardClass);
                cardInstance.name = cardDetails[tempAvailList[i] - 1].cardName;
                availableCards.Add(cardInstance);

            }
            else if (cardDetails.Where(card => card.id == tempAvailList[i] && (int)card.cardClass != generalsIndex).Count() == 1)
            {
                print("ma");
                Card cardInstance = Instantiate<Card>(cardPrefabs, availableListOfCard.transform);
                cardInstance.SetProperties(cardDetails[tempAvailList[i] - 1].id, cardDetails[tempAvailList[i] - 1].cardName, cardDetails[tempAvailList[i] - 1].cardDescription, cardDetails[tempAvailList[i] - 1].attack, cardDetails[tempAvailList[i] - 1].HP, cardDetails[tempAvailList[i] - 1].gold, cardDetails[tempAvailList[i] - 1].XP, cardDetails[tempAvailList[i] - 1].ability, cardDetails[tempAvailList[i] - 1].levelRequired, cardDetails[tempAvailList[i] - 1].cardImage, cardDetails[tempAvailList[i] - 1].ED, cardDetails[tempAvailList[i] - 1].R, cardDetails[tempAvailList[i] - 1].cardClass);
                cardInstance.name = cardDetails[tempAvailList[i] - 1].cardName;
                cardInstance.GetComponent<Image>().color = disableColor;
                availableCards.Add(cardInstance);
            }
        }

        for (int i = 0; i < tempCurrList.Count; i++)
        {
            if (cardDetails.Where(card => card.id == tempCurrList[i]).Count() == 1)
            {

                Card cardInstance = Instantiate<Card>(cardPrefabs, currentListOfCard.transform);
                cardInstance.SetProperties(cardDetails[tempCurrList[i] - 1].id, cardDetails[tempCurrList[i] - 1].cardName, cardDetails[tempCurrList[i] - 1].cardDescription, cardDetails[tempCurrList[i] - 1].attack, cardDetails[tempCurrList[i] - 1].HP, cardDetails[tempCurrList[i] - 1].gold, cardDetails[tempCurrList[i] - 1].XP, cardDetails[tempCurrList[i] - 1].ability, cardDetails[tempCurrList[i] - 1].levelRequired, cardDetails[tempCurrList[i] - 1].cardImage, cardDetails[tempCurrList[i] - 1].ED, cardDetails[tempCurrList[i] - 1].R, cardDetails[tempCurrList[i] - 1].cardClass);
                cardInstance.name = cardDetails[tempCurrList[i] - 1].cardName;
                currentCards.Add(cardInstance);
            }
        }

        addDeckObject.SetActive(false);
        editDeckObject.SetActive(true);
        search.GetComponent<TMP_InputField>().text = "";
        loading.SetActive(false);
    }


    public void SaveDeck() // Save the deck
    {
        currentCards.Clear();
        availableCards.Clear();
        if (currentListOfCard.GetComponentsInChildren<Card>().Length > 0)
        {
            for (int i = 0; i < currentListOfCard.GetComponentsInChildren<Card>().Length; i++)
            {
                currentCards.Add(currentListOfCard.GetComponentsInChildren<Card>()[i]);
            }
        }

        if (availableListOfCard.GetComponentsInChildren<Card>().Length > 0)
        {
            for (int i = 0; i < availableListOfCard.GetComponentsInChildren<Card>().Length; i++)
            {
                availableCards.Add(availableListOfCard.GetComponentsInChildren<Card>()[i]);
            }
        }

        for (int i = 0; i < currentCards.Count; i++)
        {
            if (int.Parse(currentCards[i].levelRequired.Split(" ")[1]) == 1)
            {
                countOfLevelOne++;
            }
        }

        if (countOfLevelOne < 2)
        {
            ActiveTooltip("You need at least two Level 1 cards.");
            Invoke("RemoveToolTip", 2f);
        }
        else
        {
            int[] currentCardindex = new int[currentCards.Count];
            int[] availabeCardindex = new int[availableCards.Count];

            for (int i = 0; i < currentCards.Count; i++)
            {
                currentCardindex[i] = currentCards[i].id;
            }
            for (int i = 0; i < availableCards.Count; i++)
            {
                availabeCardindex[i] = availableCards[i].id;
            }
            if (isAdd) StoreDeckId();

            StoreIds currentIndex = new StoreIds(currentCardindex);
            StoreIds availableIndex = new StoreIds(availabeCardindex);

            if (isAdd)
            {
                int deckIdLength = LoadDeckId(Application.streamingAssetsPath + "/DeckDetails/DeckId.json").id.Length;
                deckId = LoadDeckId(Application.streamingAssetsPath + "/DeckDetails/DeckId.json").id[deckIdLength - 1];
                SaveCurrentData(currentIndex, deckId);
                SaveAvailableData(availableIndex, deckId);
            }
            else if (isEdit)
            {
                int[] storeIndex = LoadDeckId(Application.streamingAssetsPath + "/DeckDetails/DeckId.json").id;
                SaveCurrentData(currentIndex, storeIndex[deckId]);
                SaveAvailableData(availableIndex, storeIndex[deckId]);
            }

            editDeckObject.SetActive(false);
            addDeckObject.SetActive(true);
            isAdd = false;
            isEdit = false;
            deckProfile.enabled = false;
            search.GetComponent<TMP_InputField>().text = "";
            DisplayDeck();
            SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
        }
        countOfLevelOne = 0;

    }

    public void StoreDeckId() // Store the deck id in json file 
    {

        int deckIdLength = LoadDeckId(Application.streamingAssetsPath + "/DeckDetails/DeckId.json").id.Length;

        int[] deckindex = new int[deckIdLength + 1];

        for (int i = 0; i < deckIdLength; i++)
        {
            deckindex[i] = LoadDeckId(Application.streamingAssetsPath + "/DeckDetails/DeckId.json").id[i];
        }

        if (deckIdLength == 0)
        {
            deckindex[deckIdLength] = int.Parse(generalsIndex + 0.ToString());
        }
        else
        {
            deckindex[deckIdLength] = int.Parse(int.Parse(generalsIndex.ToString()) + "" + (int.Parse(deckindex[deckIdLength - 1].ToString().Substring(1)) + 1));
        }
        StoreIds deckIds = new StoreIds(deckindex);
        if (deckindex.Length <= 5)
        {
            string json = JsonUtility.ToJson(deckIds);
            File.WriteAllText(Application.streamingAssetsPath + "/DeckDetails/DeckId.json", json);
        }
        deckId = deckindex.Length - 1;
    }

    public StoreIds LoadDeckId(string path) // Load deck id from json file
    {

        if (!File.Exists(path)) return null;

        string jsonString = File.ReadAllText(path);
        return JsonUtility.FromJson<StoreIds>(jsonString);
    }

    public void SaveAvailableData(StoreIds ids, int deckId) // Save available card id to json file
    {
        string json = JsonUtility.ToJson(ids);
        File.WriteAllText(Application.streamingAssetsPath + "/DeckDetails/AvailableCards" + deckId.ToString() + ".json", json);

    }

    public StoreIds LoadAvailableData(string path) // Load available card id from json file
    {
        if (!File.Exists(path)) return null;

        string jsonString = File.ReadAllText(path);
        return JsonUtility.FromJson<StoreIds>(jsonString);
    }

    public void SaveCurrentData(StoreIds ids, int deckId) // Save current card id to json file
    {

        string json = JsonUtility.ToJson(ids);
        File.WriteAllText(Application.streamingAssetsPath + "/DeckDetails/CurrentCards" + deckId.ToString() + ".json", json);
    }

    public StoreIds LoadCurrentData(string path) // Load current card id from json file
    {
        if (!File.Exists(path)) return null;

        string jsonString = File.ReadAllText(path);
        return JsonUtility.FromJson<StoreIds>(jsonString);
    }

    public void DeleteDeck() // Deleting deck
    {
        availableCards.Clear();
        currentCards.Clear();
        int deckIdLength = LoadDeckId(Application.streamingAssetsPath + "/DeckDetails/DeckId.json").id.Length;
        int[] oldIndex = LoadDeckId(Application.streamingAssetsPath + "/DeckDetails/DeckId.json").id;

        for (int i = 0; i < deckIdLength; i++)
        {
            if (int.Parse(LoadDeckId(Application.streamingAssetsPath + "/DeckDetails/DeckId.json").id[i].ToString().Substring(1)) == deckId) deleteDeckId = i;
            else
                deleteDeckId = deckId;
        }

        int[] newIndex = RemoveAtIndex(LoadDeckId(Application.streamingAssetsPath + "/DeckDetails/DeckId.json").id, deleteDeckId);
        StoreIds remainingDecks = new StoreIds(newIndex);
        string json = JsonUtility.ToJson(remainingDecks);
        File.WriteAllText(Application.streamingAssetsPath + "/DeckDetails/DeckId.json", json);
        File.Delete(Application.streamingAssetsPath + "/DeckDetails/CurrentCards" + oldIndex[deleteDeckId].ToString().Substring(0, 1) + oldIndex[deleteDeckId].ToString() + ".json");
        string oldIndexId = oldIndex[deleteDeckId].ToString();

        File.Delete(Application.streamingAssetsPath + "/DeckDetails/AvailableCards" + oldIndexId + ".json");
        File.Delete(Application.streamingAssetsPath + "/DeckDetails/CurrentCards" + oldIndexId + ".json");

        isEdit = false;
        isAdd = false;
        editDeckObject.SetActive(false);
        addDeckObject.SetActive(true);
        deckProfile.enabled = false;
        search.GetComponent<TMP_InputField>().text = "";
        availableCards.Clear();
        currentCards.Clear();
        DisplayDeck();
        SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
    }

    public void OnClickBack(int index) // Back from deck builder to main menu
    {
        SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
        SceneManager.LoadSceneAsync(index);
    }
    public void OnEditBack() // Back from edit deck screen to add deck builder
    {
        editDeckObject.SetActive(false);
        addDeckObject.SetActive(true);
        isEdit = false;
        isAdd = false;
        deckProfile.enabled = false;
        search.GetComponent<TMP_InputField>().text = "";
        availableCards.Clear();
        currentCards.Clear();
        SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
    }

    private void Init() // Initilize when user click on new deck
    {
        matchedCardListForAvailable.Clear();
        unmatchedCardListForAvailable.Clear();
        availableCards.Clear();
        currentCards.Clear();

        for (int i = 0; i < cardDetails.Count; i++)
        {
            if ((int)cardDetails[i].cardClass == generalsIndex)
            {
                matchedCardListForAvailable.Add(cardDetails[i]);

            }
            else if ((int)cardDetails[i].cardClass != generalsIndex)
            {
                unmatchedCardListForAvailable.Add(cardDetails[i]);

            }
        }

        for (int i = 0; i < matchedCardListForAvailable.Count; i++)
        {
            Card cardInstance = Instantiate<Card>(cardPrefabs, availableListOfCard.transform);
            cardInstance.SetProperties(matchedCardListForAvailable[i].id, matchedCardListForAvailable[i].cardName, matchedCardListForAvailable[i].cardDescription, matchedCardListForAvailable[i].attack, matchedCardListForAvailable[i].HP, matchedCardListForAvailable[i].gold, matchedCardListForAvailable[i].XP, matchedCardListForAvailable[i].ability, matchedCardListForAvailable[i].levelRequired, matchedCardListForAvailable[i].cardImage, matchedCardListForAvailable[i].ED, matchedCardListForAvailable[i].R, matchedCardListForAvailable[i].cardClass);
            cardInstance.name = matchedCardListForAvailable[i].cardName;
            availableCards.Add(cardInstance);
        }

        for (int i = 0; i < unmatchedCardListForAvailable.Count; i++)
        {
            Card cardInstance = Instantiate<Card>(cardPrefabs, availableListOfCard.transform);
            cardInstance.SetProperties(unmatchedCardListForAvailable[i].id, unmatchedCardListForAvailable[i].cardName, unmatchedCardListForAvailable[i].cardDescription, unmatchedCardListForAvailable[i].attack, unmatchedCardListForAvailable[i].HP, unmatchedCardListForAvailable[i].gold, unmatchedCardListForAvailable[i].XP, unmatchedCardListForAvailable[i].ability, unmatchedCardListForAvailable[i].levelRequired, unmatchedCardListForAvailable[i].cardImage, unmatchedCardListForAvailable[i].ED, unmatchedCardListForAvailable[i].R, unmatchedCardListForAvailable[i].cardClass);
            cardInstance.name = unmatchedCardListForAvailable[i].cardName;
            cardInstance.GetComponent<Image>().color = disableColor;
            availableCards.Add(cardInstance);
        }
        search.GetComponent<TMP_InputField>().text = "";
    }


    public void LiveSearch() // Live search, user can search any position in card name
    {
        searchText = search.GetComponent<TMP_InputField>().text.ToLower();
        DestroyCardList();
        newMatchAvCards.Clear();
        newUnmatchAvCards.Clear();
        newCurrCards.Clear();

        if (searchText != "")
        {
            for (int i = 0; i < availableCards.Count; i++)
            {
                if (availableCards[i].cardName.ToLower().Contains(searchText))
                {
                    if ((int)availableCards[i].cardClass == generalsIndex)
                    {
                        newMatchAvCards.Add(availableCards[i]);
                    }
                    else
                    {
                        newUnmatchAvCards.Add(availableCards[i]);
                    }

                }
            }
        }
        else if (searchText == "")
        {
            for (int i = 0; i < availableCards.Count; i++)
            {
                if ((int)availableCards[i].cardClass == generalsIndex)
                {
                    newMatchAvCards.Add(availableCards[i]);
                }
                else
                {
                    newUnmatchAvCards.Add(availableCards[i]);
                }
            }
        }
        MatchedCardInstantiate(newMatchAvCards);
        UnMatchedCardInstantiate(newUnmatchAvCards);
        CurrentCardInstantiate(currentCards);

    }

    public void RemoveToolTip() // remove tooltip after some time 
    {
        toolTip.SetActive(false);
    }

    public void ActiveTooltip(string message)
    {
        toolTip.SetActive(true);
        Transform toolTipText = toolTip.transform.Find("Info TMP");
        toolTipText.GetComponent<TMP_Text>().text = message;
    }

    public int[] RemoveAtIndex(int[] inputArray, int index) // remove index given position
    {
        int writeLoc = index;
        int readLoc = index + 1;
        int[] outputArray = new int[inputArray.Length - 1];
        for (int i = 0; i < index; i++)
        {
            outputArray[i] = inputArray[i];
        }

        for (writeLoc = index; writeLoc < outputArray.Length; writeLoc++)
        {
            outputArray[writeLoc] = inputArray[readLoc];
            readLoc++;
        }
        return outputArray;
    }

    private void DestroyCardList() // Destroy the cards in available and current card
    {
        foreach (Transform child in currentListOfCard.transform)
        {
            GameObject.Destroy(child.gameObject);
        }

        foreach (Transform child in availableListOfCard.transform)
        {
            GameObject.Destroy(child.gameObject);
        }
    }

    private void DisplayDeck() // Display deck in deck builder screen
    {
        int deckLength = LoadDeckId(Application.streamingAssetsPath + "/DeckDetails/DeckId.json").id.Length;
        int totalLength = 5;
        if (deckLength == 5)
        {
            EnableOrDisable(addDeck, disableColor, false);
        }
        else
        {
            EnableOrDisable(addDeck, enableColor, true);
        }

        if (deckLength > 0)
        {
            for (int i = 0; i < deckLength; i++)
            {

                images[i].enabled = true;
            }
        }
        for (int i = deckLength; i < totalLength; i++)
        {
            images[i].enabled = false;
        }
    }

    private void EnableOrDisable(Button button, Color color, bool value) // Enable or disable button in all screen
    {
        button.GetComponent<Image>().color = color;
        button.enabled = value;
    }

    private void ClearCards() // Clear the list of cards (List<Card>)
    {
        availableCards.Clear();
        currentCards.Clear();
        newCurrCards.Clear();
        newMatchAvCards.Clear();
        newUnmatchAvCards.Clear();
        unmatchedCardListForAvailable.Clear();
        matchedCardListForAvailable.Clear();
    }

    private void MatchedCardInstantiate(List<Card> matchedCard) // Matched card instantiate 
    {
        for (int j = 0; j < matchedCard.Count; j++)
        {
            cardInstance = Instantiate(cardPrefabs, availableListOfCard.transform);
            cardInstance.SetProperties(matchedCard[j].id, matchedCard[j].cardName, matchedCard[j].cardDescription, matchedCard[j].attack, matchedCard[j].HP, matchedCard[j].gold, matchedCard[j].XP, matchedCard[j].ability, matchedCard[j].levelRequired, matchedCard[j].image.sprite, matchedCard[j].ED, matchedCard[j].R, matchedCard[j].cardClass);
            cardInstance.name = matchedCard[j].cardName;
        }
    }

    private void UnMatchedCardInstantiate(List<Card> unmatchedCard) //Unmatched card instantiate 
    {
        for (int j = 0; j < unmatchedCard.Count; j++)
        {
            cardInstance = Instantiate(cardPrefabs, availableListOfCard.transform);
            cardInstance.SetProperties(unmatchedCard[j].id, unmatchedCard[j].cardName, unmatchedCard[j].cardDescription, unmatchedCard[j].attack, unmatchedCard[j].HP, unmatchedCard[j].gold, unmatchedCard[j].XP, unmatchedCard[j].ability, unmatchedCard[j].levelRequired, unmatchedCard[j].image.sprite, unmatchedCard[j].ED, unmatchedCard[j].R, unmatchedCard[j].cardClass);
            cardInstance.name = unmatchedCard[j].cardName;
            cardInstance.GetComponent<Image>().color = disableColor;
        }
    }

    private void CurrentCardInstantiate(List<Card> currentCard) //current card instantiate 
    {
        for (int i = 0; i < currentCard.Count; i++)
        {
            cardInstance = Instantiate(cardPrefabs, currentListOfCard.transform);
            cardInstance.SetProperties(currentCard[i].id, currentCard[i].cardName, currentCard[i].cardDescription, currentCard[i].attack, currentCard[i].HP, currentCard[i].gold, currentCard[i].XP, currentCard[i].ability, currentCard[i].levelRequired, currentCard[i].image.sprite, currentCard[i].ED, currentCard[i].R, currentCard[i].cardClass);
            cardInstance.name = currentCard[i].cardName;
        }
    }

}
