using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using TMPro;

public class DropZone : MonoBehaviour, IDropHandler
{
    
    [SerializeField] private GameObject availableListOfCard;
    [SerializeField] private Card cardPrefabs;
    [SerializeField] private TMP_InputField searchField;
    Draggable draggableCard;

    public GameObject toolTip;
    public static bool isDraggable = false;
    private bool dropEnd = false;

    List<Card> newMatchAvCards = new List<Card>();
    List<Card> newUnmatchAvCards = new List<Card>();
    List<Card> totalAvailableCards = new List<Card>();

    //dragable - drop card position
    //Draggable - actual card position

    public void OnDrop(PointerEventData eventData) // When user drop the card on drop zone
    {
        Draggable draggable = eventData.pointerDrag.GetComponent<Draggable>();
        draggableCard = draggable;
        
        if (isDraggable)
        {
            if (gameObject.name == "Delete Card")
            {
                for(int i = 0; i < DeckManager.availableCards.Count; i++)
                {
                    if(draggable.GetComponent<Card>().id == DeckManager.availableCards[i].id)
                    {
                        DeckManager.availableCards.RemoveAt(i);
                        DeckManager.availableCards.Add(draggable.GetComponent<Card>());
                    }
                }

                for (int i = 0; i < DeckManager.currentCards.Count; i++)
                {
                    if (draggable.GetComponent<Card>().id == DeckManager.currentCards[i].id)
                    {
                        DeckManager.currentCards.RemoveAt(i);
                        DeckManager.availableCards.Add(draggable.GetComponent<Card>());
                    }
                }

                for (int i = 0; i < DeckManager.availableCards.Count; i++)
                {
                    if (DeckManager.generalsIndex == (int)DeckManager.availableCards[i].cardClass)
                    {
                        newMatchAvCards.Add(DeckManager.availableCards[i]);
                    }
                    else
                    {
                        newUnmatchAvCards.Add(DeckManager.availableCards[i]);
                    }
                }
               
                GameObject parent = GameObject.FindGameObjectWithTag("Available");
                draggable.parentToReturn = parent.transform.GetChild(0).GetChild(0);
                dropEnd = true;
            }
            else if(DeckManager.isMatch)
            {
                if(draggable == null)
                {
                    return;
                }
                else
                {
                    draggable.parentToReturn = transform.GetChild(0).GetChild(0);
                    DragCards();
                    dropEnd = true;
                }
               
              
            }
            else if(!DeckManager.isMatch)
            {
                if (draggable)
                {
                    ActiveToolTip("You cannot use this card with this General.");
                    Invoke("RemoveToolTip", 2f);
                }
            }
            else if (draggable != null)
            {
                draggable.parentToReturn = transform.GetChild(0).GetChild(0);
                DragCards();
                dropEnd = true;
            }  
        }
        else
        {
            GameObject parent = GameObject.FindGameObjectWithTag("Available");
            draggable.parentToReturn = parent.transform.GetChild(0).GetChild(0);
            DragCards();
            if(Draggable.dragParent.name.Split(" ")[0] == "Available")
            {
                ActiveToolTip("You can not move more than 25 cards.");
                Invoke("RemoveToolTip", 2f);
            }
            dropEnd = true;
        }
    }

    public void RemoveToolTip() // Remove tooltip some specific time
    {
        toolTip.SetActive(false);
    }

    public void ActiveToolTip(string message)
    {
        toolTip.SetActive(true);
        Transform toolTipText  = toolTip.transform.Find("Info TMP");
        toolTipText.GetComponent<TMP_Text>().text = message;
    }

    public void DragCards() 
    {
        newMatchAvCards.Clear();
        newUnmatchAvCards.Clear();
        if (draggableCard.parentToReturn.parent.parent.name.Split(" ")[0] == "Available" && Draggable.dragParent.name.Split(" ")[0] == "Available")
        {
            for (int i = 0; i < DeckManager.availableCards.Count; i++)
            {
                if (draggableCard.GetComponent<Card>().id == DeckManager.availableCards[i].id)
                {
                    DeckManager.availableCards.RemoveAt(i);
                    DeckManager.availableCards.Add(draggableCard.GetComponent<Card>());  
                }
            }
            for(int i = 0; i < DeckManager.availableCards.Count; i++)
            {
                if(DeckManager.generalsIndex == (int)DeckManager.availableCards[i].cardClass)
                {
                    newMatchAvCards.Add(DeckManager.availableCards[i]);
                }
                else
                {
                    newUnmatchAvCards.Add(DeckManager.availableCards[i]);
                }
            }
        }
        else if (draggableCard.parentToReturn.parent.parent.name.Split(" ")[0] == "Available" && Draggable.dragParent.name.Split(" ")[0] == "Current")
        {
            
            for (int i = 0; i < DeckManager.currentCards.Count; i++)
            {
                if (draggableCard.GetComponent<Card>().id == DeckManager.currentCards[i].id)
                {
                    DeckManager.currentCards.RemoveAt(i);
                    DeckManager.availableCards.Add(draggableCard.GetComponent<Card>());
                }
            }
            for(int i = 0; i < DeckManager.availableCards.Count; i++)
            {
                if (DeckManager.generalsIndex == (int) DeckManager.availableCards[i].cardClass)
                {
                    newMatchAvCards.Add(DeckManager.availableCards[i]);
                }
                else
                {
                    newUnmatchAvCards.Add(DeckManager.availableCards[i]);
                }
            }
        }
        else if (draggableCard.parentToReturn.parent.parent.name.Split(" ")[0] == "Current" && Draggable.dragParent.name.Split(" ")[0] == "Available")
        {
            for (int i = 0; i < DeckManager.availableCards.Count; i++)
            {

                
                    if (draggableCard.GetComponent<Card>().id == DeckManager.availableCards[i].id)
                    {
                        DeckManager.availableCards.RemoveAt(i);
                        DeckManager.currentCards.Add(draggableCard.GetComponent<Card>());
                    }
            }
            for (int i = 0; i < DeckManager.availableCards.Count; i++)
            {
                if (DeckManager.generalsIndex == (int)DeckManager.availableCards[i].cardClass)
                {
                    newMatchAvCards.Add(DeckManager.availableCards[i]);
                }
                else
                {
                    newUnmatchAvCards.Add(DeckManager.availableCards[i]);
                }
            }
        }
        else if (draggableCard.parentToReturn.parent.parent.name.Split(" ")[0] == "Current" && Draggable.dragParent.name.Split(" ")[0] == "Current")
        {

            for (int i = 0; i < DeckManager.currentCards.Count; i++)
            {
                if (draggableCard.GetComponent<Card>().id == DeckManager.currentCards[i].id)
                {
                    DeckManager.currentCards.RemoveAt(i);
                    DeckManager.currentCards.Add(draggableCard.GetComponent<Card>());
                }
            }
            for(int i = 0; i < DeckManager.availableCards.Count; i++)
            {
                if (DeckManager.generalsIndex == (int)DeckManager.availableCards[i].cardClass)
                {
                    newMatchAvCards.Add(DeckManager.availableCards[i]);
                }
                else
                {
                    newUnmatchAvCards.Add(DeckManager.availableCards[i]);
                }
            }
        }
        DeckManager.isMatch = false;
        DeckManager.availableCards.Clear();
    }

    private void CardInstantiate() // Instantiate card 
    {
        totalAvailableCards.Clear();
        foreach (Transform child in availableListOfCard.transform)
        {
            GameObject.Destroy(child.gameObject);
        }
        for (int i = 0; i < newMatchAvCards.Count; i++)
        {
            Card cardInstance = Instantiate<Card>(cardPrefabs, availableListOfCard.transform);
            cardInstance.SetProperties(newMatchAvCards[i].id, newMatchAvCards[i].cardName, newMatchAvCards[i].cardDescription, newMatchAvCards[i].attack, newMatchAvCards[i].HP, newMatchAvCards[i].gold, newMatchAvCards[i].XP, newMatchAvCards[i].ability, newMatchAvCards[i].levelRequired, newMatchAvCards[i].image.sprite, newMatchAvCards[i].ED, newMatchAvCards[i].R, newMatchAvCards[i].cardClass);
            cardInstance.name = newMatchAvCards[i].cardName;
            totalAvailableCards.Add(cardInstance);
        }

        for (int i = 0; i < newUnmatchAvCards.Count; i++)
        {
            Card cardInstance = Instantiate<Card>(cardPrefabs, availableListOfCard.transform);
            cardInstance.SetProperties(newUnmatchAvCards[i].id, newUnmatchAvCards[i].cardName, newUnmatchAvCards[i].cardDescription, newUnmatchAvCards[i].attack, newUnmatchAvCards[i].HP, newUnmatchAvCards[i].gold, newUnmatchAvCards[i].XP, newUnmatchAvCards[i].ability, newUnmatchAvCards[i].levelRequired, newUnmatchAvCards[i].image.sprite, newUnmatchAvCards[i].ED, newUnmatchAvCards[i].R, newUnmatchAvCards[i].cardClass);
            cardInstance.name = newUnmatchAvCards[i].cardName;
            cardInstance.GetComponent<Image>().color = new Vector4(200f / 255f, 200f / 255f, 200f / 255f, 128f / 255f);
            totalAvailableCards.Add(cardInstance);
        }
        DeckManager.availableCards = totalAvailableCards;
        newMatchAvCards.Clear();
        newUnmatchAvCards.Clear();
        searchField.GetComponent<TMP_InputField>().text = "";
    }

    private void Update()
    {
        if(DeckManager.currentCards.Count >= 25)
        {
            isDraggable = false;
        }
        else
        {
            isDraggable = true;
        }
        if (dropEnd)
        {
            CardInstantiate();
            dropEnd = false;
        }
    }
}
