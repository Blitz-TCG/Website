using System;
using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using TMPro;
using UnityEngine.Networking;
using System.Collections;

public class BlockedScrollViewAdapter : MonoBehaviour
{
    public static BlockedScrollViewAdapter instance;
    public RectTransform prefab;
    public ScrollRect scrollView;
    public RectTransform content;
    List<ExampleItemView> views = new List<ExampleItemView>();
    public MainMenuUIManager mainMenuUIManager;

    void Awake()
    {
        if (instance == null)
        {
            instance = this;
        }
        else if (instance != this)
        {
            Destroy(instance.gameObject);
        }

        mainMenuUIManager = GameObject.FindObjectOfType<MainMenuUIManager>();
    }

    public void UpdateItems2(int count2)
    {
        MainMenuUIManager.instance.blockedListTotal.text = count2 + "/200";;
        StartCoroutine(FetchItemModelsFromServer2(count2, results => OnReceivedNewModels(results)));
    }

    public void OnReceivedNewModels(ExampleItemModel[] models)
    {
        foreach (Transform child in content)
            Destroy(child.gameObject);
        views.Clear();

        int i = 0;
        foreach (var model in models)
        {
            var instance = GameObject.Instantiate(prefab.gameObject) as GameObject;
            instance.transform.SetParent(content, false);
            var view = InitializeItemView(instance, model);
            views.Add(view);

            i++;
        }

        MainMenuUIManager.instance.friendsImageLoading.SetActive(false); //todo consider moving this into the foreach loop and doing i == models.length or count
    }

    ExampleItemView InitializeItemView(GameObject viewGameObject, ExampleItemModel model)
    {
        ExampleItemView view = new ExampleItemView(viewGameObject.transform);

        view.titleText.text = model.title;
        view.userIDText.text = model.userID;
        return view;
    }

    IEnumerator FetchItemModelsFromServer2(int count, Action<ExampleItemModel[]> onDone)
    {
        yield return new WaitForEndOfFrame();

        var results = new ExampleItemModel[count];
        for (int i = 0; i < count; i++)
        {
                results[i] = new ExampleItemModel();
                results[i].title = mainMenuUIManager.blockedListUsernames[i];
                results[i].userID = mainMenuUIManager.blockedListUserIDs[i];
        }

        onDone(results);
    }

    public class ExampleItemView
    {
        public TMP_Text titleText;
        public TMP_Text userIDText;
        public ExampleItemView(Transform rootView)
        {
            titleText = rootView.Find("TitleText").GetComponent<TMP_Text>();
            userIDText = rootView.Find("UserIDText").GetComponent<TMP_Text>();
        }

    }

    public class ExampleItemModel
    {
        public string title, userID;
    }
}
