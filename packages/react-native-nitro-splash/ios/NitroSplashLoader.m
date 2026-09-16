#import <Foundation/Foundation.h>

// Swift `@_cdecl` export. Overlay must attach before JS loads so Phase B
// covers the handoff from the LaunchScreen storyboard.
extern void nitro_splash_start_observing(void);

@interface NitroSplashLoader : NSObject
@end

@implementation NitroSplashLoader

+ (void)load {
  dispatch_async(dispatch_get_main_queue(), ^{
    nitro_splash_start_observing();
  });
}

@end
