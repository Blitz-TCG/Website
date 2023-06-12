using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using System;
using UnityEngine.UI;

public class Draggable : MonoBehaviour, IBeginDragHandler, IDragHandler, IEndDragHandler
{

    public Transform parentToReturn = null;
    public static Transform dragParent;
    public static bool dragEnd;
    public static int cardclassIndex;
    private Vector3 screenPoint;
    private Vector3 offset;

    public void OnBeginDrag(PointerEventData eventData) // when user drag the cards
    {
        screenPoint = Camera.main.WorldToScreenPoint(transform.position);
        offset = transform.position - Camera.main.ScreenToWorldPoint(new Vector3(
            Input.mousePosition.x, Input.mousePosition.y, screenPoint.z));

        CardClass cardClass = transform.GetComponent<Card>().cardClass;
        cardclassIndex  = (int)Convert.ChangeType(cardClass, cardClass.GetTypeCode());
        dragParent = transform.parent.parent.parent;

        parentToReturn = transform.parent;
        transform.SetParent(transform.parent.parent.parent.parent);
       
        GetComponent<CanvasGroup>().blocksRaycasts = false;
        
        if(dragParent.name.Split(" ")[0] == "Available"  || dragParent.name.Split(" ")[0] == "Current")
        {
            if (DeckManager.generalsIndex == cardclassIndex)
            {
                DeckManager.isMatch = true;
            }
            else
            {
                DeckManager.isMatch = false;
            }
        }
    }


    public void OnDrag(PointerEventData eventData) // When user hold the card
    {
        Vector3 curScreenPoint = new Vector3(Input.mousePosition.x, Input.mousePosition.y, screenPoint.z);
        Vector3 curPosition = Camera.main.ScreenToWorldPoint(curScreenPoint) + offset;
        transform.position = curPosition;
    }

    public void OnEndDrag(PointerEventData eventData) // When user drag remove
    {
        transform.SetParent(parentToReturn);
        GetComponent<CanvasGroup>().blocksRaycasts = true;
        dragEnd = true;
    }
}

