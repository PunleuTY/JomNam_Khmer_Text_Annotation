const progressValue =
          totalImages && totalImages.total_images
            ? Math.round(
                ((totalImages.annotated_images) /
                  totalImages.total_images) *
                  100
              )
            : 0;
        setCompletionRate(progressValue);
        console.log(completionRate)