using System;
using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using TMPro;
using UnityEngine.Networking;
using System.Collections;

public class FriendsScrollViewAdapter : MonoBehaviour
{
    public static FriendsScrollViewAdapter instance;

    public Texture2D[] pfps;
    public RectTransform prefab;
    public Text countText;
    public ScrollRect scrollView;
    public RectTransform content;
    List<ExampleItemView> views = new List<ExampleItemView>();
    public MainMenuUIManager mainMenuUIManager;

    //todo - add a bunch of gameobjects for the different PFPs
    public GameObject test;

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

    public void UpdateItems() //original - only for reference of what a coroutine here might look like, used for testing
    {
        int newCount;
        int.TryParse(countText.text, out newCount);
        Array.Resize(ref pfps, newCount);
        if (newCount <= 50)
        {
            FetchItemModelsFromServer(newCount, results => OnReceivedNewModels(results));
            MainMenuUIManager.instance.friendsListTotal.text = newCount + "/50"; //just for demonstration purposes
        }
        else
        {
            MainMenuUIManager.instance.outputTextFriendsErorr.text = "You cannot have more than 50 friends"; //testing, just showing how we can stop it at 200
        }
    }

    public void UpdateItems2(int count2)
    {
        MainMenuUIManager.instance.friendsListTotal.text = count2 + "/50";
        Array.Resize(ref pfps, count2);
        StartCoroutine(FetchItemModelsFromServer2(count2, results => OnReceivedNewModels(results)));
    }

    /*    IEnumerator StepUpdate()
        {
            to wait for array resizes?
        }*/

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
        //view.imagePFP.texture = pfps[model.pfpIndex];
        view.onlineStatusText.text = model.onlineStatus;
        view.pfpText.text = model.pfp;
        return view;
    }

    public void FetchItemModelsFromServer(int count, Action<ExampleItemModel[]> onDone)
    //IEnumerator FetchItemModelsFromServer(int count, Action<ExampleItemModel[]> onDone) //was ienumerator originally
    {
        var results = new ExampleItemModel[count];
        for (int i = 0; i < count; i++)
        {
            results[i] = new ExampleItemModel();
            results[i].title = "Username " + i;
            results[i].userID = "UserID " + i;
        }
        onDone(results);
    }
    IEnumerator FetchItemModelsFromServer2(int count, Action<ExampleItemModel[]> onDone)
    {
        var results = new ExampleItemModel[count];

        yield return new WaitForEndOfFrame();
        /*System.Uri photoURL = null;*/

        for (int i = 0; i < count; i++)
        {
/*            photoURL = new System.Uri(mainMenuUIManager.friendsListUserPFPs[i]);
            UnityWebRequest request = UnityWebRequestTexture.GetTexture(photoURL.ToString());

            yield return request.SendWebRequest();
            if (request.error != null)
            {

                if (request.result == UnityWebRequest.Result.ProtocolError)
                {
                    mainMenuUIManager.outputTextFriendsErorr.text = "Image type not supported, please use a different image";
                }
                else
                {
                    mainMenuUIManager.outputTextFriendsErorr.text = "Unknown error while loading image";
                }
            }
            else
            {*/
                results[i] = new ExampleItemModel();
                results[i].title = mainMenuUIManager.friendsListUsernames[i];
                results[i].userID = mainMenuUIManager.friendsListUserIDs[i];
                results[i].onlineStatus = mainMenuUIManager.friendsListOnlineStatus[i];
                results[i].pfp = mainMenuUIManager.friendsListUserPFPs[i];

                //Texture2D image = ((DownloadHandlerTexture)request.downloadHandler).texture;
                //pfps[i] = image;
                //results[i].pfpIndex = i;
          /*  }*/

        }

        onDone(results);
    }

    public class ExampleItemView
    {
        public TMP_Text titleText;
        public TMP_Text userIDText;
        //public RawImage imagePFP;
        public TMP_Text onlineStatusText;
        public TMP_Text pfpText;
        public ExampleItemView(Transform rootView)
        {
            titleText = rootView.Find("TitleText").GetComponent<TMP_Text>();
            userIDText = rootView.Find("UserIDText").GetComponent<TMP_Text>();
            //imagePFP = rootView.Find("IconImage").GetComponent<RawImage>();
            onlineStatusText = rootView.Find("OnlineStatusText").GetComponent<TMP_Text>();
            pfpText = rootView.Find("PFPText").GetComponent<TMP_Text>();
        }

    }

    public class ExampleItemModel
    {
        public string title, userID, onlineStatus, pfp;
        //public int pfpIndex;
    }
}
