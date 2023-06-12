using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class AliasMethodTesting : MonoBehaviour
{
    private double[] probability;
    private int[] alias;

    void Start()
    {
        System.Random random = new System.Random();
        var num = random.Next(0, 11);
        Debug.Log(random.Next(num));
        probability = new double[11];
        alias = new int[11];


        Debug.Log(probability.Length);
        Debug.Log(alias.Length);

        double average = 11;

        List<double> small = new List<double>();
        List<double> large = new List<double>();

        probability = new double[] {5, 20, 1, 25, 14, 100, 16, 7, 27, 61, 34};
        for (int i = 0; i < 11; ++i)
        {

            if (probability[i] >= average)
            {
                large.Add(probability[i]);

            }
            else
            {
                small.Add(probability[i]);
            }


        }
    }

}
